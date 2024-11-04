// const express = require('express');
// const mysql = require('mysql2/promise');
// const cors = require('cors');
// const app = express();
// const PORT = 3001;

// app.use(cors({
//     origin: 'http://localhost:3000', // allow only frontend origin, more secure (ig)
//     methods: ['GET', 'POST'],        
//     credentials: true                
// }));

// app.use(express.json());

// const db = mysql.createPool({
//     host: 'localhost',
//     user: 'root',
//     password: '25102004',
//     database: 'dbms_project',
//     waitForConnections: true,
//     connectionLimit: 10,
//     queueLimit: 0
// });
// // err loggin
// app.get('/api/test-db', async (req, res) => {
//     try {
//         const [result] = await db.query('SELECT 1');
//         res.json({ status: 'Database connection successful', result });
//     } catch (err) {
//         console.error('Database connection error:', err);
//         res.status(500).json({ error: 'Database connection failed', details: err.message });
//     }
// });
// // note this
// app.get('/student/assignments', async (req, res) => {
//     try {
//         await db.query('SELECT 1');
//         const query = `
//             SELECT a.assignment_id, a.title 
//             FROM Assignment AS a 
//             JOIN AssignmentClass AS ac ON a.assignment_id = ac.assignment_id 
//             WHERE ac.class = ?;
//         `;
        
//         console.log('curr query:', query);
        
//         const [assignments] = await db.execute(query, ['M']);
        
//         console.log('query results:', assignments);
        
//         if (!assignments || assignments.length === 0) {
//             return res.status(404).json({ 
//                 message: 'No assignments found',
//                 debug: {
//                     query: query,
//                     class: 'M'
//                 }
//             });
//         }
        
//         res.json(assignments);
//     } catch (err) {
//         console.error('Error details:', err);
//         res.status(500).json({ 
//             error: 'Failed to retrieve assignments',
//             details: err.message,
//             sqlMessage: err.sqlMessage || null
//         });
//     }
// });

// app.listen(PORT, () => {
//     console.log(`Server running on http://localhost:${PORT}`);
//     console.log('Available routes:');
//     console.log('- GET /api/test-db (Test database connection)');
//     console.log('- GET /student/assignments (Get assignments)');
// });























// import React, { useEffect, useState } from 'react';
// import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
// import './App.css';

// const StudentAssignments = () => {
//     const [assignments, setAssignments] = useState([]);
//     const [error, setError] = useState(null);
//     const [loading, setLoading] = useState(true);
//     const navigate = useNavigate();

//     useEffect(() => {
//         const testDatabaseConnection = async () => {
//             try {
//                 const response = await fetch('http://localhost:3001/api/test-db');
//                 const data = await response.json();
//                 console.log('Database connection test:', data);
//                 if (!response.ok) {
//                     throw new Error('Database connection failed');
//                 }
//             } catch (err) {
//                 console.error('Database connection test failed:', err);
//                 setError('Database connection failed. Please check if the server is running.');
//                 return false;
//             }
//             return true;
//         };

//         const fetchAssignments = async () => {
//             try {
//                 setLoading(true);
//                 setError(null);
//                 const isDbConnected = await testDatabaseConnection();
//                 if (!isDbConnected) return;

//                 const response = await fetch('http://localhost:3001/student/assignments');
//                 console.log('Response status:', response.status);
                
//                 const data = await response.json();
//                 console.log('Response data:', data);

//                 if (!response.ok) {
//                     throw new Error(data.error || 'Failed to fetch assignments');
//                 }

//                 if (Array.isArray(data)) {
//                     setAssignments(data);
//                 } else {
//                     console.error('Unexpected data format:', data);
//                     throw new Error('Invalid data format received from server');
//                 }
//             } catch (err) {
//                 console.error('Error fetching assignments:', err);
//                 setError(err.message || 'Failed to fetch assignments');
//             } finally {
//                 setLoading(false);
//             }
//         };

//         fetchAssignments();
//     }, []);

//     const handleAssignmentClick = (assignmentId) => {
//         navigate(`/assignments/${assignmentId}`);
//     };

//     if (loading) {
//         return (
//             <div className="assignments-container">
//                 <h1>Loading assignments...</h1>
//                 <p>Please wait while we fetch your assignments.</p>
//             </div>
//         );
//     }

//     if (error) {
//         return (
//             <div className="assignments-container error">
//                 <h1>Error Loading Assignments</h1>
//                 <p className="error-message">{error}</p>
//                 <div className="debug-info">
//                     <h3>Debug Information:</h3>
//                     <p>If you're seeing this, you're probably DUMB. Please check if:</p>
//                     <ul>
//                         <li>The backend server is running on port 3001</li>
//                         <li>MySQL server is running</li>
//                         <li>Database 'dbms_project' is changed to the respective one in your system.</li>
//                     </ul>
//                 </div>
//             </div>
//         );
//     }

//     return (
//         <div className="assignments-container">
//             <h1>Assignments</h1>
//             {assignments.length === 0 ? (
//                 <p>No assignments found for your class.</p>
//             ) : (
//                 <ul className="assignments-list">
//                     {assignments.map(assignment => (
//                         <li 
//                             key={assignment.assignment_id} 
//                             onClick={() => handleAssignmentClick(assignment.assignment_id)}
//                             className="assignment-item"
//                         >
//                             {assignment.title}
//                         </li>
//                     ))}
//                 </ul>
//             )}
//         </div>
//     );
// };

// const AssignmentDetails = () => {
//     return (
//         <div className="assignment-details">
//             <h2>Assignment Details</h2>
//             <p>Details for the assignment will appear here. (in this case, the ungrouped and teams)</p>
//         </div>
//     );
// };

// const App = () => {
//     return (
//         <Router>
//             <Routes>
//                 <Route path="/" element={<Navigate to="/student/assignments" replace />} />
//                 <Route path="/student/assignments" element={<StudentAssignments />} />
//                 <Route path="/assignments/:assignmentId" element={<AssignmentDetails />} />
//             </Routes>
//         </Router>
//     );
// };
// export default App;




// const express = require('express');
// const mysql = require('mysql2/promise');
// const cors = require('cors');
// const app = express();
// const PORT = 3001;

// app.use(cors({
//     origin: 'http://localhost:3000',
//     methods: ['GET', 'POST'],
//     credentials: true
// }));

// app.use(express.json());

// const db = mysql.createPool({
//     host: 'localhost',
//     user: 'root',
//     password: '25102004',
//     database: 'dbms_project',
//     waitForConnections: true,
//     connectionLimit: 10,
//     queueLimit: 0
// });

// app.get('/api/test-db', async (req, res) => {
//     try {
//         const [result] = await db.query('SELECT 1');
//         res.json({ status: 'success', result });
//     } catch (err) {
//         res.status(500).json({ status: 'error', message: err.message });
//     }
// });

// app.get('/student/assignments', async (req, res) => {
//     try {
//         const query = `
//             SELECT 
//                 a.assignment_id,
//                 a.title,
//                 a.description,
//                 a.min_team_size,
//                 a.max_team_size,
//                 a.deadline,
//                 a.teacher_id
//             FROM Assignment AS a 
//             JOIN AssignmentClass AS ac ON a.assignment_id = ac.assignment_id 
//             WHERE ac.class = ?
//             ORDER BY a.deadline ASC;`;

//         const [assignments] = await db.execute(query, ['M']);  // section is harcoded for now, should be directed from login page

//         if (!assignments.length) {
//             return res.status(404).json({ 
//                 status: 'error', 
//                 message: 'No assignments found' 
//             });
//         }

//         res.json(assignments);
//     } catch (err) {
//         res.status(500).json({ 
//             status: 'error', 
//             message: err.message 
//         });
//     }
// });

// app.listen(PORT, () => {
//     console.log(`Server running on http://localhost:${PORT}`);
// });





// // import React, { useState, useEffect } from 'react';
// // import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
// // import './App.css';

// // const StudentAssignments = () => {
// //     const [assignments, setAssignments] = useState([]);
// //     const [error, setError] = useState(null);
// //     const [loading, setLoading] = useState(true);
// //     const [expandedId, setExpandedId] = useState(null);
// //     const navigate = useNavigate();

// //     useEffect(() => {
// //         const fetchAssignments = async () => {
// //             try {
// //                 setLoading(true);
// //                 setError(null);
// //                 const response = await fetch('http://localhost:3001/student/assignments');
// //                 const data = await response.json();

// //                 if (!response.ok) {
// //                     throw new Error(data.error || 'Failed to fetch assignments');
// //                 }

// //                 if (Array.isArray(data)) {
// //                     setAssignments(data);
// //                 } else {
// //                     throw new Error('Invalid data format received from server');
// //                 }
// //             } catch (err) {
// //                 setError(err.message || 'Failed to fetch assignments');
// //             } finally {
// //                 setLoading(false);
// //             }
// //         };

// //         fetchAssignments();
// //     }, []);

// //     const toggleExpand = (assignmentId) => {
// //         setExpandedId(expandedId === assignmentId ? null : assignmentId);
// //     };

// //     if (loading) {
// //         return (
// //             <div className="container">
// //                 <div className="loading">
// //                     <h2>Loading assignments...</h2>
// //                     <p>Please wait while we fetch your assignments.</p>
// //                 </div>
// //             </div>
// //         );
// //     }

// //     if (error) {
// //         return (
// //             <div className="container">
// //                 <div className="error-container">
// //                     <h2>Error Loading Assignments</h2>
// //                     <p className="error-message">{error}</p>
// //                     <div className="error-help">
// //                         <h3>Troubleshooting:</h3>
// //                         <ul>
// //                             <li>Check if the backend server is running (port 3001)</li>
// //                             <li>Verify MySQL connection</li>
// //                             <li>Ensure database name is correct</li>
// //                         </ul>
// //                     </div>
// //                 </div>
// //             </div>
// //         );
// //     }

// //     return (
// //         <div className="container">
// //             <h1 className="page-title">Assignments</h1>
// //             <div className="assignments-list">
// //                 {assignments.length === 0 ? (
// //                     <p className="no-assignments">No assignments found for your class.</p>
// //                 ) : (
// //                     assignments.map(assignment => (
// //                         <div 
// //                             key={assignment.assignment_id}
// //                             className={`assignment-card ${expandedId === assignment.assignment_id ? 'expanded' : ''}`}
// //                             onClick={() => toggleExpand(assignment.assignment_id)}
// //                         >
// //                             <div className="assignment-header">
// //                                 <h3 className="assignment-title">{assignment.title}</h3>
// //                                 <span className="expand-icon">
// //                                     {expandedId === assignment.assignment_id ? '▼' : '▶'}
// //                                 </span>
// //                             </div>
                            
// //                             <div className="assignment-details">
// //                                 <p className="description">
// //                                     {assignment.description || 'No description provided'}
// //                                 </p>
                                
// //                                 <div className="info-grid">
// //                                     <div className="info-item">
// //                                         <strong>Team Size:</strong>
// //                                         <span>{assignment.min_team_size} - {assignment.max_team_size} members</span>
// //                                     </div>
                                    
// //                                     <div className="info-item">
// //                                         <strong>Deadline:</strong>
// //                                         <span>
// //                                             {assignment.deadline ? 
// //                                                 new Date(assignment.deadline).toLocaleDateString('en-US', {
// //                                                     year: 'numeric',
// //                                                     month: 'long',
// //                                                     day: 'numeric'
// //                                                 }) : 'No deadline set'}
// //                                         </span>
// //                                     </div>
// //                                 </div>
                                
// //                                 <div className="important-notes">  
// //                                     <h4>Important Notes:</h4>
// //                                     <ul>
// //                                         <li>Submit your work before the deadline</li>
// //                                         <li>Form teams within the size limits</li>
// //                                         <li>Review description thoroughly</li>  
// //                                     </ul>
// //                                 </div>
// //                             </div>
// //                         </div>
// //                     ))
// //                 )}
// //             </div>
// //         </div>
// //     );
// // };





// // const App = () => {
// //     return (
// //         <Router>
// //             <Routes>
// //                 <Route path="/" element={<StudentAssignments />} />
// //             </Routes>
// //         </Router>
// //     );
// // };

// // export default App;



// import React, { useState, useEffect } from 'react';
// import { BrowserRouter as Router, Routes, Route, useNavigate, useParams } from 'react-router-dom';
// import './App.css';

// const AssignmentDetails = () => {
//     const { assignmentId } = useParams();
//     const [assignment, setAssignment] = useState(null);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState(null);
//     const navigate = useNavigate();

//     useEffect(() => {
//         const fetchAssignmentDetails = async () => {
//             try {
//                 setLoading(true);
//                 const response = await fetch(`http://localhost:3001/assignments/${assignmentId}`);
//                 const data = await response.json();

//                 if (!response.ok) {
//                     throw new Error(data.error || 'Failed to fetch assignment details');
//                 }

//                 setAssignment(data);
//             } catch (err) {
//                 setError(err.message || 'Failed to fetch assignment details');
//             } finally {
//                 setLoading(false);
//             }
//         };

//         fetchAssignmentDetails();
//     }, [assignmentId]);

//     if (loading) {
//         return (
//             <div className="container">
//                 <div className="loading">
//                     <h2>Loading assignment details...</h2>
//                 </div>
//             </div>
//         );
//     }

//     if (error) {
//         return (
//             <div className="container">
//                 <div className="error-container">
//                     <h2>Error Loading Assignment Details</h2>
//                     <p className="error-message">{error}</p>
//                     <button 
//                         className="back-button"
//                         onClick={() => navigate('/')}
//                     >
//                         Back to Assignments
//                     </button>
//                 </div>
//             </div>
//         );
//     }

//     return (
//         <div className="container">
//             <div className="assignment-details-page">
//                 <button 
//                     className="back-button"
//                     onClick={() => navigate('/')}
//                 >
//                     ← Back to Assignments
//                 </button>
                
//                 {assignment ? (
//                     <>
//                         <h1>{assignment.title}</h1>
//                         <div className="details-content">
//                             <section className="description-section">
//                                 <h2>Description</h2>
//                                 <p>{assignment.description || 'No description provided'}</p>
//                             </section>

//                             <section className="team-section">
//                                 <h2>Team Requirements</h2>
//                                 <p>Team Size: {assignment.min_team_size} - {assignment.max_team_size} members</p>
//                             </section>

//                             <section className="deadline-section">
//                                 <h2>Deadline</h2>
//                                 <p>
//                                     {assignment.deadline ? 
//                                         new Date(assignment.deadline).toLocaleDateString('en-US', {
//                                             year: 'numeric',
//                                             month: 'long',
//                                             day: 'numeric',
//                                             hour: '2-digit',
//                                             minute: '2-digit'
//                                         }) 
//                                         : 'No deadline set'}
//                                 </p>
//                             </section>
//                         </div>
//                     </>
//                 ) : (
//                     <p>Assignment not found</p>
//                 )}
//             </div>
//         </div>
//     );
// };

// const StudentAssignments = () => {
//     const [assignments, setAssignments] = useState([]);
//     const [error, setError] = useState(null);
//     const [loading, setLoading] = useState(true);
//     const [expandedId, setExpandedId] = useState(null);
//     const navigate = useNavigate();

//     useEffect(() => {
//         const fetchAssignments = async () => {
//             try {
//                 setLoading(true);
//                 setError(null);
//                 const response = await fetch('http://localhost:3001/student/assignments');
//                 const data = await response.json();

//                 if (!response.ok) {
//                     throw new Error(data.error || 'Failed to fetch assignments');
//                 }

//                 if (Array.isArray(data)) {
//                     setAssignments(data);
//                 } else {
//                     throw new Error('Invalid data format received from server');
//                 }
//             } catch (err) {
//                 setError(err.message || 'Failed to fetch assignments');
//             } finally {
//                 setLoading(false);
//             }
//         };

//         fetchAssignments();
//     }, []);

//     const toggleExpand = (assignmentId, event) => {
//         // Prevent the click event from propagating if clicking the button
//         if (event.target.closest('.view-details-btn')) {
//             return;
//         }
//         setExpandedId(expandedId === assignmentId ? null : assignmentId);
//     };

//     const handleViewDetails = (e, assignmentId) => {
//         e.stopPropagation(); // Prevent the card from toggling
//         navigate(`/assignments/${assignmentId}`);
//     };

//     if (loading) {
//         return (
//             <div className="container">
//                 <div className="loading">
//                     <h2>Loading assignments...</h2>
//                     <p>Please wait while we fetch your assignments.</p>
//                 </div>
//             </div>
//         );
//     }

//     if (error) {
//         return (
//             <div className="container">
//                 <div className="error-container">
//                     <h2>Error Loading Assignments</h2>
//                     <p className="error-message">{error}</p>
//                     <div className="error-help">
//                         <h3>Troubleshooting:</h3>
//                         <ul>
//                             <li>Check if the backend server is running (port 3001)</li>
//                             <li>Verify MySQL connection</li>
//                             <li>Ensure database name is correct</li>
//                         </ul>
//                     </div>
//                 </div>
//             </div>
//         );
//     }

//     return (
//         <div className="container">
//             <h1 className="page-title">Assignments</h1>
//             <div className="assignments-list">
//                 {assignments.length === 0 ? (
//                     <p className="no-assignments">No assignments found for your class.</p>
//                 ) : (
//                     assignments.map(assignment => (
//                         <div 
//                             key={assignment.assignment_id}
//                             className={`assignment-card ${expandedId === assignment.assignment_id ? 'expanded' : ''}`}
//                             onClick={(e) => toggleExpand(assignment.assignment_id, e)}
//                         >
//                             <div className="assignment-header">
//                                 <h3 className="assignment-title">{assignment.title}</h3>
//                                 <span className="expand-icon">
//                                     {expandedId === assignment.assignment_id ? '▼' : '▶'}
//                                 </span>
//                             </div>
                            
//                             {expandedId === assignment.assignment_id && (
//                                 <div className="assignment-details">
//                                     <p className="description">
//                                         {assignment.description || 'No description provided'}
//                                     </p>
                                    
//                                     <div className="info-grid">
//                                         <div className="info-item">
//                                             <strong>Team Size:</strong>
//                                             <span>{assignment.min_team_size} - {assignment.max_team_size} members</span>
//                                         </div>
                                        
//                                         <div className="info-item">
//                                             <strong>Deadline:</strong>
//                                             <span>
//                                                 {assignment.deadline ? 
//                                                     new Date(assignment.deadline).toLocaleDateString('en-US', {
//                                                         year: 'numeric',
//                                                         month: 'long',
//                                                         day: 'numeric'
//                                                     }) : 'No deadline set'}
//                                             </span>
//                                         </div>
//                                     </div>
                                    
//                                     <div className="important-notes">  
//                                         <h4>Important Notes:</h4>
//                                         <ul>
//                                             <li>Submit your work before the deadline</li>
//                                             <li>Form teams within the size limits</li>
//                                             <li>Review description thoroughly</li>  
//                                         </ul>
//                                     </div>

//                                     <button 
//                                         className="view-details-btn"
//                                         onClick={(e) => handleViewDetails(e, assignment.assignment_id)}
//                                     >
//                                         View Full Details
//                                     </button>
//                                 </div>
//                             )}
//                         </div>
//                     ))
//                 )}
//             </div>
//         </div>
//     );
// };

// const App = () => {
//     return (
//         <Router>
//             <Routes>
//                 <Route path="/" element={<StudentAssignments />} />
//                 <Route path="/assignments/:assignmentId" element={<AssignmentDetails />} />
//             </Routes>
//         </Router>
//     );
// };

// export default App;


