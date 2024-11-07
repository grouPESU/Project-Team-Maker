const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const app = express();
const PORT = 3006;

app.use(cors({
    origin: 'http://localhost:5173', // allow only frontend origin, more secure (ig)
    methods: ['GET', 'POST'],        
    credentials: true                
}));

app.use(express.json());

const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '2289',
    database: 'finalgroupes',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});
// err loggin
app.get('/api/test-db', async (req, res) => {
    try {
        const [result] = await db.query('SELECT 1');
        res.json({ status: 'Database connection successful', result });
    } catch (err) {
        console.error('Database connection error:', err);
        res.status(500).json({ error: 'Database connection failed', details: err.message });
    }
});
// note this
app.get('/student/assignments', async (req, res) => {
    try {
        await db.query('SELECT 1');
        const query = `
            SELECT a.assignment_id, a.title, a.description 
            FROM Assignment AS a 
            JOIN AssignmentClass AS ac ON a.assignment_id = ac.assignment_id 
            WHERE ac.class = ?;
        `;
        
        console.log('curr query:', query);
        
        const [assignments] = await db.execute(query, ['M']);
        
        console.log('query results:', assignments);
        
        if (!assignments || assignments.length === 0) {
            return res.status(404).json({ 
                message: 'No assignments found',
                debug: {
                    query: query,
                    class: 'M'
                }
            });
        }
        
        res.json(assignments);
    } catch (err) {
        console.error('Error details:', err);
        res.status(500).json({ 
            error: 'Failed to retrieve assignments',
            details: err.message,
            sqlMessage: err.sqlMessage || null
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('Available routes:');
    console.log('- GET /api/test-db (Test database connection)');
    console.log('- GET /student/assignments (Get assignments)');
});
