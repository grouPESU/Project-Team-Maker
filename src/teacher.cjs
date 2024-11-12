const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

db.connect((err) => {
    if (err) throw err;
    console.log('Connected to MySQL database');
});


const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_ADDR,
        pass: process.env.EMAIL_PASS
    }
});

app.post('/createAssignment', (req, res) => {
    const { title, description, min_team_size, max_team_size, deadline, classes, teacher_id } = req.body;

    db.query('SELECT assignment_id FROM Assignment ORDER BY assignment_id DESC LIMIT 1', (err, result) => {
        if (err) throw err;

        let new_assignment_id;
        if (result.length === 0) {
            new_assignment_id = 'PESASSN000001';
        } else {
            const last_id = result[0].assignment_id;
            const num = parseInt(last_id.slice(-6)) + 1;
            new_assignment_id = `PESASSN${num.toString().padStart(6, '0')}`;
        }

        const assignmentSql = 'INSERT INTO Assignment (assignment_id, title, description, min_team_size, max_team_size, deadline, teacher_id) VALUES (?, ?, ?, ?, ?, ?, ?)';
        db.query(assignmentSql, [new_assignment_id, title, description, min_team_size, max_team_size, deadline, teacher_id], (err, result) => {
            if (err) throw err;

            const assignmentClassSql = 'INSERT INTO AssignmentClass (class, assignment_id) VALUES ?';
            const values = classes.map(className => [className, new_assignment_id]);

            db.query(assignmentClassSql, [values], (err, result) => {
                if (err) throw err;
                res.json({ message: 'Assignment created successfully', assignment_id: new_assignment_id });
            });
        });
    });
});

app.get('/getAssignments', (req, res) => {
    const teacher_id = req.query.teacher_id;
    const sql = `
    SELECT a.*, GROUP_CONCAT(ac.class) as classes
    FROM Assignment a
    LEFT JOIN AssignmentClass ac ON a.assignment_id = ac.assignment_id
    WHERE a.teacher_id = ?
        GROUP BY a.assignment_id
    `;
    db.query(sql, [teacher_id], (err, result) => {
        if (err) throw err;
        res.json(result);
    });
});

app.put('/updateAssignment/:id', (req, res) => {
    const { id } = req.params;
    const { title, description, min_team_size, max_team_size, deadline, classes } = req.body;

    const updateAssignmentSql = 'UPDATE Assignment SET title = ?, description = ?, deadline = ? WHERE assignment_id = ?';
    db.query(updateAssignmentSql, [title, description, deadline, id], (err, result) => {
        if (err) {
            res.status(500).json({ error: 'Failed to update assignment' });
            return;
        }

        const deleteAssignmentClassSql = 'DELETE FROM AssignmentClass WHERE assignment_id = ?';
        db.query(deleteAssignmentClassSql, [id], (err, result) => {
            if (err) {
                res.status(500).json({ error: 'Failed to update assignment classes' });
                return;
            }

            const insertAssignmentClassSql = 'INSERT INTO AssignmentClass (class, assignment_id) VALUES ?';
            const values = classes.map(className => [className, id]);

            db.query(insertAssignmentClassSql, [values], (err, result) => {
                if (err) {
                    res.status(500).json({ error: 'Failed to update assignment classes' });
                    return;
                }
                res.json({ message: 'Assignment updated successfully' });
            });
        });
    });
});

app.delete('/deleteAssignment/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM Assignment WHERE assignment_id = ?';

    db.query(sql, [id], (err, result) => {
        if (err) {
            res.status(500).json({ error: 'Failed to delete assignment' });
        } else {
            res.json({ message: 'Assignment deleted successfully' });
        }
    });
});

app.post('/pushTeamStatus/:assignmentId', (req, res) => {
    const { assignmentId } = req.params;

    const query = `
    SELECT 
    t.team_id,
        tm.team_member_id,
        tm.role,
        a.title as assignment_title,
        a.teacher_id,
        te.email as teacher_email
    FROM Team t
    JOIN Team_member tm ON t.team_id = tm.team_id
    JOIN Assignment a ON t.assignment_id = a.assignment_id
    JOIN TeacherEmail te ON a.teacher_id = te.teacher_id
    WHERE t.assignment_id = ?
        ORDER BY t.team_id, tm.role DESC`;

    db.query(query, [assignmentId], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to fetch team status' });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: 'No teams found for this assignment' });
        }

        const teams = {};
        let teacherEmail = '';
        let assignmentTitle = '';

        results.forEach(row => {
            if (!teams[row.team_id]) {
                teams[row.team_id] = [];
            }
            teams[row.team_id].push({
                memberId: row.team_member_id,
                role: row.role
            });
            teacherEmail = row.teacher_email;
            assignmentTitle = row.assignment_title;
        });

        let emailContent = `Team Status for Assignment: ${assignmentTitle}\n\n`;

        Object.entries(teams).forEach(([teamId, members]) => {
            emailContent += `Team ID: ${teamId}\n`;
            members.forEach(member => {
                emailContent += `- ${member.memberId} (${member.role})\n`;
            });
            emailContent += '\n';
        });

        const mailOptions = {
            from: 'your-email@gmail.com',
            to: teacherEmail,
            subject: `Team Status - ${assignmentTitle}`,
            text: emailContent
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                return res.status(500).json({ error: 'Failed to send email' });
            }
            res.json({ message: 'Team status email sent successfully' });
        });
    });
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
