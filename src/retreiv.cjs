const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const port = 3001;

app.use(express.json());
app.use(cors({
    origin: 'http://localhost:5173', 
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 200
}));

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: 'http://localhost:5173',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: true
    }
});

const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '2289',
    database: 'finalgroupes'
};

// Generate unique team ID
function generateTeamId() {
    return 'T' + Date.now().toString().slice(-8) + Math.random().toString(36).slice(-4);
}

io.on('connection', (socket) => {
    console.log('Client connected');

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

async function fetchDataFromDB() {
    const connection = await mysql.createConnection(dbConfig);
    try {
        const [rows] = await connection.execute(
            `SELECT student_id, firstname, class 
            FROM Student 
            WHERE student_id NOT IN (
                SELECT team_member_id 
                FROM Team_member
                WHERE team_id IN (
                    SELECT team_id
                    FROM Team
                    WHERE assignment_id = 'PESASSN000001'
                )
            )`
        );
        return rows;
    } finally {
        await connection.end();
    }
}


// Add member to team
;app.post('/api/teams/:teamId/members', async (req, res) => {
    const { teamId } = req.params;
    const { studentId } = req.body;
    const connection = await mysql.createConnection(dbConfig);

    try {
        await connection.beginTransaction();

        await connection.execute(
            'INSERT INTO Team_member (team_id, team_member_id, role) VALUES (?, ?, ?)',
            [teamId, studentId, 'member']
        );

        await connection.commit();

        // Emit event to all connected clients
        io.emit('teamUpdate', { type: 'memberAdded', teamId, studentId });

        res.json({ message: 'Member added successfully' });
    } catch (error) {
        await connection.rollback();
        console.error('Error adding team member:', error);
        res.status(500).json({ error: 'Failed to add team member' });
    } finally {
        await connection.end();
    }
});

app.get('/api/teamsync', async (req, res) => {
    const assignmentId = 'PESASSN000001'; // Fixed assignment ID
    const connection = await mysql.createConnection(dbConfig);

    try {
        const [teams] = await connection.execute(
            `SELECT t.team_id, t.leader_team_id, tm.team_member_id, tm.role
            FROM Team t
            LEFT JOIN Team_member tm ON t.team_id = tm.team_id
            WHERE t.assignment_id = ?`,
            [assignmentId]
        );

        // Transform the data to match frontend state structure
        const transformedTeams = teams.reduce((acc, curr) => {
            if (!acc[curr.team_id]) {
                acc[curr.team_id] = {
                    title: curr.team_id,
                    order: [],
                    leader: curr.leader_team_id, // Add leader information
                    memberRoles: {} // Track roles for each member
                };
            }
            if (curr.team_member_id) {
                acc[curr.team_id].order.push(curr.team_member_id);
                acc[curr.team_id].memberRoles[curr.team_member_id] = curr.role;
            }
            return acc;
        }, {});

        res.json(transformedTeams);
    } catch (error) {
        console.error('Error fetching teams:', error);
        res.status(500).json({ error: 'Failed to fetch teams' });
    } finally {
        await connection.end();
    }
});

//app.get('/api/teamsync', async (req, res) => {
//    const assignmentId = 'PESASSN000001'; // Fixed assignment ID
//    const connection = await mysql.createConnection(dbConfig);
//
//    try {
//        const [teams] = await connection.execute(
//            `SELECT t.team_id, t.leader_team_id, tm.team_member_id 
//            FROM Team t
//            LEFT JOIN Team_member tm ON t.team_id = tm.team_id
//            WHERE t.assignment_id = ?`,
//            [assignmentId]
//        );
//
//        // Transform the data to match frontend state structure
//        const transformedTeams = teams.reduce((acc, curr) => {
//            if (!acc[curr.team_id]) {
//                acc[curr.team_id] = {
//                    title: curr.team_id,
//                    order: []
//                };
//            }
//            if (curr.team_member_id) {
//                acc[curr.team_id].order.push(curr.team_member_id);
//            }
//            return acc;
//        }, {});
//
//        res.json(transformedTeams);
//    } catch (error) {
//        console.error('Error fetching teams:', error);
//        res.status(500).json({ error: 'Failed to fetch teams' });
//    } finally {
//        await connection.end();
//    }
//});

app.post('/api/teams', async (req, res) => {
    const { creatorId } = req.body;
    const assignmentId = "PESASSN000001"; // Consistent with other routes
    const teamId = generateTeamId();
    const connection = await mysql.createConnection(dbConfig);

    try {
        // Check if the user is already a member of a team for this assignment
        const isInTeam = await checkStudentTeamMembership(connection, creatorId, assignmentId);
        console.log("Is he in a team?", isInTeam)

        if (isInTeam) {
            return res.status(400).json({
                error: 'You are already a member of a team for this assignment',
                alreadyInTeam: true
            });
        }

        await connection.beginTransaction();

        // Create team record with assignment_id
        await connection.execute(
            'INSERT INTO Team (team_id, leader_team_id, assignment_id) VALUES (?, ?, ?)',
            [teamId, creatorId, assignmentId]
        );

        // Add creator as team member with leader role
        await connection.execute(
            'INSERT INTO Team_member (team_id, team_member_id, role) VALUES (?, ?, ?)',
            [teamId, creatorId, 'leader']
        );

        await connection.commit();
        io.emit('teamUpdate', {
            type: 'teamCreated',
            teamId,
            team: {
                title: teamId,
                order: [creatorId]
            },
            creatorId
        });
        res.json({ teamId, message: 'Team created successfully' });
    } catch (error) {
        await connection.rollback();
        console.error('Error creating team:', error);
        res.status(500).json({ error: 'Failed to create team' });
    } finally {
        await connection.end();
    }
});

app.delete('/api/teams/:teamId/members/:studentId', async (req, res) => {
    const { teamId, studentId } = req.params;
    const connection = await mysql.createConnection(dbConfig);

    try {
        await connection.beginTransaction();

        // Check if the member is the team leader
        const [leaderRow] = await connection.execute(
            'SELECT leader_team_id FROM Team WHERE team_id = ?',
            [teamId]
        );

        if (leaderRow[0]?.leader_team_id === studentId) {
            throw new Error('Cannot remove team leader');
        }

        await connection.execute(
            'DELETE FROM Team_member WHERE team_id = ? AND team_member_id = ?',
            [teamId, studentId]
        );

        await connection.commit();

        // Emit socket event for member removal
        io.emit('teamUpdate', { 
            type: 'memberRemoved', 
            teamId, 
            studentId 
        });

        res.json({ message: 'Member removed successfully' });
    } catch (error) {
        await connection.rollback();
        console.error('Error removing team member:', error);
        res.status(500).json({ 
            error: error.message === 'Cannot remove team leader' 
            ? 'Team leader cannot be removed from the team' 
            : 'Failed to remove team member'
        });
    } finally {
        await connection.end();
    }
});


app.delete('/api/teams/:teamId', async (req, res) => {
    const { teamId } = req.params;
    const connection = await mysql.createConnection(dbConfig);

    try {
        await connection.beginTransaction();

        const [teamMembers] = await connection.execute(
            'SELECT team_member_id FROM Team_member WHERE team_id = ?',
            [teamId]
        );

        // Delete team members first (due to foreign key constraints)
        await connection.execute(
            'DELETE FROM Team_member WHERE team_id = ?',
            [teamId]
        );

        // Then delete the team
        await connection.execute(
            'DELETE FROM Team WHERE team_id = ?',
            [teamId]
        );

        await connection.commit();
        io.emit('teamUpdate', {
            type: 'teamDeleted',
            teamId,
            teamMembers: teamMembers.map(member => member.team_member_id)
        });

        res.json({ message: 'Team deleted successfully' });
    } catch (error) {
        await connection.rollback();
        console.error('Error deleting team:', error);
        res.status(500).json({ error: 'Failed to delete team' });
    } finally {
        await connection.end();
    }
});

// Fetch teams for assignment
app.get('/api/teams', async (req, res) => {
    const assignmentId = '1234'; // Fixed assignment ID
    const connection = await mysql.createConnection(dbConfig);

    try {
        const [teams] = await connection.execute(
            `SELECT t.team_id, t.leader_team_id, tm.team_member_id 
            FROM Team t
            LEFT JOIN Team_member tm ON t.team_id = tm.team_id
            WHERE t.assignment_id = ?`,
            [assignmentId]
        );

        // Transform the data to match frontend state structure
        const transformedTeams = teams.reduce((acc, curr) => {
            if (!acc[curr.team_id]) {
                acc[curr.team_id] = {
                    title: curr.team_id,
                    order: []
                };
            }
            if (curr.team_member_id) {
                acc[curr.team_id].order.push(curr.team_member_id);
            }
            return acc;
        }, {});

        res.json(transformedTeams);
    } catch (error) {
        console.error('Error fetching teams:', error);
        res.status(500).json({ error: 'Failed to fetch teams' });
    } finally {
        await connection.end();
    }
});

async function checkStudentTeamMembership(connection, studentId, assignmentId) {
    const [existingTeams] = await connection.execute(
        `SELECT t.team_id 
        FROM Team t
        JOIN Team_member tm ON t.team_id = tm.team_id
        WHERE tm.team_member_id = ? AND t.assignment_id = ?`,
        [studentId, assignmentId]
    );

    return existingTeams.length > 0;
}

function transformData(rows) {
    const students = {};
    const nameListOrder = [];

    rows.forEach((row) => {
        const studentId = row.student_id;
        students[studentId] = {
            id: studentId,
            section: row.class,
            name: row.firstname
        };
        nameListOrder.push(studentId);
    });

    return {
        students: students,
        columns: {
            nameList: {
                title: "nameList",
                order: nameListOrder,
            }
        },
    };
}

app.get('/api/students', async (req, res) => {
    try {
        const rows = await fetchDataFromDB();
        const transformedData = transformData(rows);
        console.log(transformData)
        res.json(transformedData);
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

server.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
