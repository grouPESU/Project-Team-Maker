const express = require('express');
const multer = require('multer');
const mysql = require('mysql2');
const csv = require('csv-parser');
const fs = require('fs');
const cors = require('cors');
const nodemailer = require('nodemailer');
require('dotenv').config();
const app = express();
const port = 3000;

// Database connection
const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    //host: 'localhost',
    //user: 'root', 
    //password: '25102004', 
    //database: 'dbms_project' 
});

// Email transporter setup
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'groupes.edu@gmail.com',    
        pass: 'uymi xswo zlya qxyr'        
    }
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Multer setup for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Connect to database
connection.connect((err) => {
    if (err) {
        console.error('Error connecting to the database:', err);
    } else {
        console.log('Connected to the database.');
    }
});

// Helper Functions
const validateIdFormat = (id, table) => {
    if (!id.startsWith('PES')) return false;

    const numberAfterPES = id.charAt(3);
    if (table === 'Teacher' && numberAfterPES !== '4') return false;
    if (table === 'Student' && numberAfterPES !== '2') return false;

    return true;
};

const sendPasswordEmail = async (email, password, isTeacher = false) => {
    const mailOptions = {
        from: 'nsashank2510@gmail.com',
        to: email,
        subject: 'Your Password Information',
        text: `Your ${isTeacher ? 'teacher' : 'student'} account password is: ${password}\n\nPlease keep this information secure.`,
        html: `
        <h2>Password Information</h2>
        <p>Your ${isTeacher ? 'teacher' : 'student'} account password is: <strong>${password}</strong></p>
        <p>Please keep this information secure.</p>
        <p><small>This is an automated message. Please do not reply.</small></p>
        `
    };

    return transporter.sendMail(mailOptions);
};

// Routes
app.get('/getPassword/:table/:id', async (req, res) => {  
    const { table, id } = req.params;
    console.log(`Received request for password retrieval: Table = ${table}, ID = ${id}`);
    if (table !== 'Teacher' && table !== 'Student') {
        console.error(`Invalid table name: ${table}`);
        return res.status(400).json({ message: 'Invalid table name' });
    }
    if (!validateIdFormat(id, table)) {
        console.error(`Invalid ID format: ${id} for table ${table}`);
        return res.status(400).json({ 
            message: `Invalid ID format. ${table} IDs must start with PES${table === 'Teacher' ? '4' : '2'}`
        });
    }

    const procedureCall = 'CALL GetPassword(?, ?, @user_password);';  // Just call the procedure to set @user_password

    console.log('Executing stored procedure with query:', procedureCall);

    // Execute the stored procedure to set @user_password
    connection.query(procedureCall, [table, id], async (err, results) => {  // Mark this callback as async
        if (err) {
            console.error('Database error during stored procedure execution:', err);
            return res.status(500).json({ message: 'Database error', error: err.message });
        }

        console.log('Stored procedure executed successfully. Results:', results);

        // Now, fetch the password stored in @user_password
        const getPasswordQuery = 'SELECT @user_password AS password;';

        connection.query(getPasswordQuery, async (err, passwordResults) => {  // Ensure this callback is async as well
            if (err) {
                console.error('Error fetching password:', err);
                return res.status(500).json({ message: 'Error fetching password', error: err.message });
            }

            console.log('Password retrieved:', passwordResults);

            if (passwordResults.length === 0 || !passwordResults[0].password) {
                console.error(`No password found for ${table} with ID ${id}`);
                return res.status(404).json({ message: `${table} with ID ${id} not found or password missing` });
            }

            const userPassword = passwordResults[0].password;
            console.log(`Password retrieved for ${table} with ID ${id}:`, userPassword);
        });
    });

    const query = `
    SELECT t.*, e.email 
    FROM ${table} t 
    JOIN ${table}Email e ON t.${table.toLowerCase()}_id = e.${table.toLowerCase()}_id 
    WHERE t.${table.toLowerCase()}_id = ?
        `;

    connection.query(query, [id], async (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Database error', error: err.message });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: `${table} with ID ${id} not found` });
        }

        const user = results[0];

        try {
            await sendPasswordEmail(user.email, user.password, table === 'Teacher');
            res.json({ password: user.password });
        } catch (emailError) {
            console.error('Email sending error:', emailError);
            res.json({ 
                password: user.password,
                emailError: 'Failed to send password to email'
            });
        }
    });
});

app.post('/updatePassword', express.json(), (req, res) => {
    const { table, id, newPassword } = req.body;

    if (table !== 'Teacher' && table !== 'Student') {
        return res.status(400).json({ message: 'Invalid table name' });
    }

    if (!validateIdFormat(id, table)) {
        return res.status(400).json({ 
            message: `Invalid ID format. ${table} IDs must start with PES${table === 'Teacher' ? '4' : '2'}`
        });
    }

    const query = `
    SELECT t.*, e.email 
    FROM ${table} t 
    JOIN ${table}Email e ON t.${table.toLowerCase()}_id = e.${table.toLowerCase()}_id 
    WHERE t.${table.toLowerCase()}_id = ?
        `;

    connection.query(query, [id], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Database error', error: err.message });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: `${table} with ID ${id} not found` });
        }

        const user = results[0];
        const updateQuery = `UPDATE ${table} SET password = ? WHERE ${table.toLowerCase()}_id = ?`;

        connection.query(updateQuery, [newPassword, id], async (err) => {
            if (err) {
                console.error('Error updating password:', err);
                return res.status(500).json({ message: 'Database error', error: err.message });
            }

            try {
                await sendPasswordEmail(user.email, newPassword, table === 'Teacher');
                res.json({ message: 'Password updated and sent to email successfully' });
            } catch (emailError) {
                console.error('Email sending error:', emailError);
                res.json({ 
                    message: 'Password updated successfully but failed to send email',
                    emailError: emailError.message 
                });
            }
        });
    });
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

        const insertQuery = 'INSERT INTO Student (student_id, firstname, lastname, class, date_of_birth, password, admin_id) VALUES ?';
        const values = students.map(student => [
            student.student_id, 
            student.firstname, 
            student.lastname, 
            student.class, 
            student.date_of_birth, 
            student.password, 
            student.admin_id
        ]);

        connection.query(insertQuery, [values], (err) => {
            if (err) {
                console.error('Error inserting students:', err);
                return res.status(500).json({ message: 'Database error', error: err.message });
            }

            const emailValues = students.map(student => [student.student_id, student.email]);
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

        const insertQuery = 'INSERT INTO Teacher (teacher_id, firstname, lastname, date_of_birth, password, admin_id) VALUES ?';
        const values = teachers.map(teacher => [
            teacher.teacher_id, 
            teacher.firstname, 
            teacher.lastname, 
            teacher.date_of_birth, 
            teacher.password, 
            teacher.admin_id
        ]);

        connection.query(insertQuery, [values], (err) => {
            if (err) {
                console.error('Error inserting teachers:', err);
                return res.status(500).json({ message: 'Database error', error: err.message });
            }

            const emailValues = teachers.map(teacher => [teacher.teacher_id, teacher.email]);
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

app.post('/reset', (req, res) => {
    const resetQueries = [
        'DELETE FROM StudentEmail',
        'DELETE FROM TeacherEmail',
        'DELETE FROM Student',
        'DELETE FROM Teacher'
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

app.post('/push-mail', async (req, res) => {
    const { table, id } = req.body;

    if (table !== 'Teacher' && table !== 'Student') {
        return res.status(400).json({ message: 'Invalid table name' });
    }

    if (!validateIdFormat(id, table)) {
        return res.status(400).json({ 
            message: `Invalid ID format. ${table} IDs must start with PES${table === 'Teacher' ? '4' : '2'}`
        });
    }

    try {
        const query = `
        SELECT t.*, e.email 
        FROM ${table} t 
        JOIN ${table}Email e ON t.${table.toLowerCase()}_id = e.${table.toLowerCase()}_id 
        WHERE t.${table.toLowerCase()}_id = ?
            `;

        connection.query(query, [id], async (err, results) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ message: 'Database error', error: err.message });
            }

            if (results.length === 0) {
                return res.status(404).json({ message: `${table} with ID ${id} not found` });
            }

            const user = results[0];

            try {
                await sendPasswordEmail(user.email, user.password, table === 'Teacher');
                res.json({ message: 'Password sent successfully to email' });
            } catch (emailError) {
                console.error('Email sending error:', emailError);
                res.status(500).json({ message: 'Error sending email', error: emailError.message });
            }
        });
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Start server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
