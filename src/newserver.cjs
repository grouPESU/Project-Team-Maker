const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const app = express();
const PORT = 3006;
require('dotenv').config();
app.use(cors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
}));

app.use(express.json());

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

app.get('/api/test-db', async (req, res) => {
    try {
        const [result] = await db.query('SELECT 1');
        res.json({ status: 'success', result });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

app.get('/student/assignments', async (req, res) => {
    try {
        const query = `
        SELECT 
        a.assignment_id,
            a.title,
            a.description,
            a.min_team_size,
            a.max_team_size,
            a.deadline,
            a.teacher_id
        FROM Assignment AS a 
        JOIN AssignmentClass AS ac ON a.assignment_id = ac.assignment_id 
        WHERE ac.class = ?
            ORDER BY a.deadline ASC;`;

        const [assignments] = await db.execute(query, ['M']);  // section is harcoded for now, should be directed from login page

        if (!assignments.length) {
            return res.status(404).json({ 
                status: 'error', 
                message: 'No assignments found' 
            });
        }

        res.json(assignments);
    } catch (err) {
        res.status(500).json({ 
            status: 'error', 
            message: err.message 
        });
    }
});

app.get('/student/assignments/:assignmentId', async (req, res) => {
    try {
        const { assignmentId } = req.params;

        const query = `
        SELECT 
        a.assignment_id,
            a.title,
            a.description,
            a.min_team_size,
            a.max_team_size,
            a.deadline,
            a.teacher_id,
            ac.class
        FROM Assignment AS a 
        JOIN AssignmentClass AS ac ON a.assignment_id = ac.assignment_id 
        JOIN Teacher AS t ON a.teacher_id = t.teacher_id
        WHERE a.assignment_id = ? AND ac.class = ?`;

        const [assignment] = await db.execute(query, [assignmentId, 'M']); // 'M' is hardcoded for now

        if (!assignment.length) {
            return res.status(404).json({ 
                status: 'error', 
                message: 'Assignment not found' 
            });
        }

        res.json(assignment[0]);
    } catch (err) {
        console.error('Error fetching assignment details:', err);
        res.status(500).json({ 
            status: 'error', 
            message: err.message 
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
