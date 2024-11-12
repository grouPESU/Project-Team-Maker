const express = require('express');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
const port = 3002;

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '25102004',
  database: 'dbms_project'
});

app.use(cors({
  origin: 'http://localhost:5173', 
  credentials: true,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Accept']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

const createStrategy = (tableName, idColumn) => {
  return new LocalStrategy((username, password, done) => {
    const query = `SELECT * FROM ?? WHERE ?? = ? AND password = ?`;
    connection.query(query, [tableName, idColumn, username, password], (err, results) => {
      if (err) return done(err);
      if (results.length === 0) return done(null, false, { message: 'Incorrect credentials' });
      return done(null, { id: results[0][idColumn], role: tableName.toLowerCase() });
    });
  });
};

// Define strategies for each role (admin, student, teacher)
passport.use('admin', createStrategy('Admin', 'admin_id'));
passport.use('student', createStrategy('Student', 'student_id'));
passport.use('teacher', createStrategy('Teacher', 'teacher_id'));

// Login route
app.post('/login', (req, res, next) => {
  const { role } = req.body;

  if (!['admin', 'student', 'teacher'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }

// RBAC
  passport.authenticate(role, { session: false }, (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.status(401).json({ message: 'Authentication failed', info });
    
    return res.json({ message: 'Login successful', user });
  })(req, res, next);
});

// Registration route
app.post('/register', async (req, res) => {
  const { role, id, firstName, lastName, dob, password } = req.body;
  
    // role validation
  if (!['admin', 'student', 'teacher'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }

  try {
    const checkQuery = `SELECT * FROM ?? WHERE ??=?`;
    const tableName = role.charAt(0).toUpperCase() + role.slice(1); // Capitalize first letter
    const idColumn = `${role}_id`;

    connection.query(checkQuery, [tableName, idColumn, id], (err, results) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ message: 'Database error' });
      }

      if (results.length === 0) {
        return res.status(400).json({ 
          message: `${tableName} ID not found or already registered` 
        });
      }

      const updateQuery = `
        UPDATE ?? 
        SET password = ?, 
            firstname = ?, 
            lastname = ?, 
            date_of_birth = ?
        WHERE ?? = ?`;

      connection.query(
        updateQuery, 
        [tableName, password, firstName, lastName, dob, idColumn, id],
        (updateErr, updateResults) => {
          if (updateErr) {
            console.error('Registration error:', updateErr);
            return res.status(500).json({ message: 'Registration failed' });
          }

          res.json({ 
            message: 'Registration successful',
            user: {
              id,
              role,
              firstName,
              lastName
            }
          });
        }
      );
    });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

