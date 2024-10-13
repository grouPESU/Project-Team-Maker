const express = require('express');
const multer = require('multer');
const mysql = require('mysql2');
const csv = require('csv-parser');
const fs = require('fs');
const cors = require('cors');

const app = express();
const port = 3000;

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root', 
  password: '2289', 
  database: 'groupes' 
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors()); 

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err);
  } else {
    console.log('Connected to the database.');
  }
});

app.post('/upload', upload.single('file'), (req, res) => {
  const file = req.file;

  if (!file || (file.originalname !== 'Student.csv' && file.originalname !== 'Teacher.csv')) {
    return res.status(400).json({ message: 'Invalid file name. Please upload Student.csv or Teacher.csv.' });
  }

  const isStudentFile = file.originalname === 'Student.csv';
  const records = [];

  const tempFilePath = `./temp_${file.originalname}`;
  fs.writeFileSync(tempFilePath, file.buffer);

  fs.createReadStream(tempFilePath)
    .pipe(csv())
    .on('data', (data) => {
      records.push(data);
    })
    .on('end', () => {
      fs.unlinkSync(tempFilePath);

      if (isStudentFile) {
        insertStudents(records, res);
      } else {
        insertTeachers(records, res);
      }
    })
    .on('error', (error) => {
      console.error('Error parsing CSV:', error);
      res.status(500).json({ message: 'Error parsing CSV file', error: error.message });
    });
});

const insertStudents = (students, res) => {
  const queryCheck = 'SELECT COUNT(*) AS count FROM Student';

  connection.query(queryCheck, (err, results) => {
    if (err) {
      console.error('Error checking Student table:', err);
      return res.status(500).json({ message: 'Database error', error: err.message });
    }

    if (results[0].count > 0) {
      return res.status(400).json({ message: 'Student table is not empty. Please reset the database.' });
    }

    // actual query - 1
    const insertQuery = 'INSERT INTO Student (student_id, firstname, lastname, class, date_of_birth, password, admin_id) VALUES ?';
    const values = students.map(student => [student.student_id, student.firstname, student.lastname, student.class, student.date_of_birth, student.password, student.admin_id]);

    connection.query(insertQuery, [values], (err) => {
      if (err) {
        console.error('Error inserting students:', err);
        return res.status(500).json({ message: 'Database error', error: err.message });
      }

      const emailValues = students.map(student => [student.student_id, student.email]);

      // another query for syncing the StudEm table..........
      const insertEmailQuery = 'INSERT INTO StudentEmail (student_id, email) VALUES ?';

      connection.query(insertEmailQuery, [emailValues], (err) => {
        if (err) {
          console.error('Error inserting student emails:', err);
          return res.status(500).json({ message: 'Database error', error: err.message });
        }
        res.json({ message: 'Students added successfully.' });
      });
    });
  });
};

const insertTeachers = (teachers, res) => {
  const queryCheck = 'SELECT COUNT(*) AS count FROM Teacher';

  connection.query(queryCheck, (err, results) => {
    if (err) {
      console.error('Error checking Teacher table:', err);
      return res.status(500).json({ message: 'Database error', error: err.message });
    }

    if (results[0].count > 0) {
      return res.status(400).json({ message: 'Teacher table is not empty. Please reset the database.' });
    }

    // query
    const insertQuery = 'INSERT INTO Teacher (teacher_id, firstname, lastname, date_of_birth, password, admin_id) VALUES ?';
    const values = teachers.map(teacher => [teacher.teacher_id, teacher.firstname, teacher.lastname, teacher.date_of_birth, teacher.password, teacher.admin_id]);

    connection.query(insertQuery, [values], (err) => {
      if (err) {
        console.error('Error inserting teachers:', err);
        return res.status(500).json({ message: 'Database error', error: err.message });
      }

      const emailValues = teachers.map(teacher => [teacher.teacher_id, teacher.email]);
      // T-email table
      const insertEmailQuery = 'INSERT INTO TeacherEmail (teacher_id, email) VALUES ?';

      connection.query(insertEmailQuery, [emailValues], (err) => {
        if (err) {
          console.error('Error inserting teacher emails:', err);
          return res.status(500).json({ message: 'Database error', error: err.message });
        }
        res.json({ message: 'Teachers added successfully.' });
      });
    });
  });
};



// don't run this part, need to first set up triggers in the db
app.post('/reset', (req, res) => {
    const resetQueries = [
      'TRUNCATE TABLE StudentEmail',
      'TRUNCATE TABLE TeacherEmail',
      'TRUNCATE TABLE Student',
      'TRUNCATE TABLE Teacher'
    ];

    const executeQueries = (queries, index) => {
      if (index === queries.length) {
        return res.json({ message: 'Database reset successfully.' });
      }
  
      connection.query(queries[index], (err) => {
        if (err) {
          console.error(`Error resetting database (Query ${index + 1}):`, err);
          return res.status(500).json({ message: 'Database error', error: err.message });
        }
        executeQueries(queries, index + 1);
      });
    };

    executeQueries(resetQueries, 0);
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
