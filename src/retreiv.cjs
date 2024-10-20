const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
const port = 3001; // Choose an appropriate port

app.use(cors({
  origin: 'http://localhost:5173', // Replace with your React app's URL
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
  optionsSuccessStatus: 200
}));

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '2289',
  database: 'groupes'
};

async function fetchDataFromDB() {
  const connection = await mysql.createConnection(dbConfig);
  
  try {
    const [rows] = await connection.execute('select student_id, firstname, class from Student');
    return rows;
  } finally {
    await connection.end();
  }
}

function transformData(rows) {
  const students = {};
  const nameListOrder = [];

  rows.forEach((row) => {
    const studentId = `student-${row.student_id}`;
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
      },
      'team-1': {
        title: "team-1",
        order: [],
      },
      'team-2': {
        title: "team-2",
        order: [],
      },
      'team-3': {
        title: "team-3",
        order: [],
      },
      'team-4': {
        title: "team-4",
        order: [],
      },
    },
  };
}

app.get('/api/students', async (req, res) => {
  try {
    const rows = await fetchDataFromDB();
    const transformedData = transformData(rows);
    res.json(transformedData);
    console.log(transformedData);
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
