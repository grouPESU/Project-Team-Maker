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
  password: '2289',
  database: 'finalgroupes'
});

db.connect((err) => {
  if (err) throw err;
  console.log('Connected to MySQL database');
});


app.post('/createAssignment', (req, res) => {
    const { title, description, min_team_size, max_team_size, deadline, classes } = req.body;
    const teacher_id = 'PES4UG19CS118'; // Hardcoded teacher_id
  
    // Get the last assignment_id
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
  
        // Insert entries into AssignmentClass
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
    const teacher_id = 'PES4UG19CS118'; // Hardcoded teacher_id
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

// Update Assignment
app.put('/updateAssignment/:id', (req, res) => {
  const { id } = req.params;
  const { title, description, min_team_size, max_team_size, deadline, classes } = req.body;

  const updateAssignmentSql = 'UPDATE Assignment SET title = ?, description = ?, min_team_size = ?, max_team_size = ?, deadline = ? WHERE assignment_id = ?';
  db.query(updateAssignmentSql, [title, description, min_team_size, max_team_size, deadline, id], (err, result) => {
    if (err) {
      console.error('Error updating assignment:', err);
      res.status(500).json({ error: 'Failed to update assignment' });
      return;
    }

    // Delete existing AssignmentClass entries
    const deleteAssignmentClassSql = 'DELETE FROM AssignmentClass WHERE assignment_id = ?';
    db.query(deleteAssignmentClassSql, [id], (err, result) => {
      if (err) {
        console.error('Error deleting AssignmentClass entries:', err);
        res.status(500).json({ error: 'Failed to update assignment classes' });
        return;
      }

      // Insert new AssignmentClass entries
      const insertAssignmentClassSql = 'INSERT INTO AssignmentClass (class, assignment_id) VALUES ?';
      const values = classes.map(className => [className, id]);

      db.query(insertAssignmentClassSql, [values], (err, result) => {
        if (err) {
          console.error('Error inserting new AssignmentClass entries:', err);
          res.status(500).json({ error: 'Failed to update assignment classes' });
          return;
        }
        res.json({ message: 'Assignment updated successfully' });
      });
    });
  });
});

// Delete Assignment
app.delete('/deleteAssignment/:id', (req, res) => {
  const { id } = req.params;
  const sql = 'DELETE FROM Assignment WHERE assignment_id = ?';
  
  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error('Error deleting assignment:', err);
      res.status(500).json({ error: 'Failed to delete assignment' });
    } else {
      res.json({ message: 'Assignment deleted successfully' });
    }
  });
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
