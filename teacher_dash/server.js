const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '25102004',
  database: 'dbms_project'
});

db.connect((err) => {
  if (err) throw err;
  console.log('Connected to MySQL database');
});

app.post('/createAssignment', (req, res) => {
  const { title, description, min_team_size, max_team_size, deadline } = req.body;
  const teacher_id = 'PES4UG19CS119'; // hardcoded teacher_id for now, we shall replace later from login pg

  // to fetch prev instd id
  db.query('SELECT assignment_id FROM Assignment ORDER BY assignment_id DESC LIMIT 1', (err, result) => {
    if (err) throw err;

    let new_assignment_id;
    if (result.length === 0) {
      new_assignment_id = 'PESASSN000001';
    } 
    else 
    {
      const last_id = result[0].assignment_id;
      const num = parseInt(last_id.slice(-6)) + 1;
      new_assignment_id = `PESASSN${num.toString().padStart(6, '0')}`;
    }

    // to add new one
    const sql = 'INSERT INTO Assignment (assignment_id, title, description, min_team_size, max_team_size, deadline, teacher_id) VALUES (?, ?, ?, ?, ?, ?, ?)';
    db.query(sql, [new_assignment_id, title, description, min_team_size, max_team_size, deadline, teacher_id], (err, result) => {
      if (err) throw err;
      res.json({ message: 'Assignment created successfully', assignment_id: new_assignment_id });
    });
  });
});

app.get('/getAssignments', (req, res) => {
  const teacher_id = 'PES4UG19CS119'; // same
  const sql = 'SELECT * FROM Assignment WHERE teacher_id = ?';
  db.query(sql, [teacher_id], (err, result) => {
    if (err) throw err;
    res.json(result);
  });
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));