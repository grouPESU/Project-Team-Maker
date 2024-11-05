import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import './newass.css';

const AssignmentDetails = () => {
    const { assignmentId } = useParams();
    const [assignment, setAssignment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchAssignmentDetails = async () => {
            try {
                setLoading(true);
                const response = await fetch(`http://localhost:3006/student/assignments/${assignmentId}`); // each ass details, change within this page
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || 'Failed to fetch assignment details');
                }

                setAssignment(data);
            } catch (err) {
                console.error('Error fetching assignment details:', err);
                setError(err.message || 'Failed to fetch assignment details');
            } finally {
                setLoading(false);
            } 
        };

        fetchAssignmentDetails();
    }, [assignmentId]);

    if (loading) {
        return (
            <div className="container">
                <div className="loading">
                    <h2>Loading assignment details...</h2>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container">
                <div className="error-container">
                    <h2>Error Loading Assignment Details</h2>
                    <p className="error-message">{error}</p>
                    <button 
                        className="back-button"
                        onClick={() => navigate('/')}
                    >
                        Back to Assignments
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="container">
            <div className="assignment-details-page">
                <button 
                    className="back-button"
                    onClick={() => navigate('/')}
                >
                    ← Back to Assignments
                </button>
                
                {assignment ? (
                    <>
                        <h1>{assignment.title}</h1>
                        <div className="details-content">
                            <section className="description-section">
                                <h2>Description</h2>
                                <p>{assignment.description || 'No description provided'}</p>
                            </section>

                            <section className="teacher-section">
                                <h2>Instructor</h2>
                                <p>{assignment.teacher_name}</p>
                            </section>

                            <section className="team-section">
                                <h2>Team Requirements</h2>
                                <p>Team Size: {assignment.min_team_size} - {assignment.max_team_size} members</p>
                                <p>Class: {assignment.class}</p>
                            </section>

                            <section className="deadline-section">
                                <h2>Deadline</h2>
                                <p>
                                    {assignment.deadline ? 
                                        new Date(assignment.deadline).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        }) 
                                        : 'No deadline set'}
                                </p>
                            </section>
                        </div>
                    </>
                ) : (
                    <p>Assignment not found</p>
                )}
            </div>
        </div>
    );
};

const StudentAssignments = () => {
    const [assignments, setAssignments] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchAssignments = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await fetch('http://localhost:3006/student/assignments');
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || 'Failed to fetch assignments');
                }

                if (Array.isArray(data)) {
                    setAssignments(data);
                } else {
                    throw new Error('Invalid data format received from server');
                }
            } catch (err) {
                setError(err.message || 'Failed to fetch assignments');
            } finally {
                setLoading(false);
            }
        };

        fetchAssignments();
    }, []);

    const toggleExpand = (assignmentId, event) => {
        if (event.target.closest('.view-details-btn')) {
            return;
        }
        setExpandedId(expandedId === assignmentId ? null : assignmentId);
    };

    const handleViewDetails = (e, assignment) => {
        navigate('/main', { 
            state: { 
                assignmentTitle: assignment.title,
                assignmentDescription: assignment.description,
                assignmentId: assignment.assignment_id
            } 
        });
    };

    if (loading) {
        return (
            <div className="container">
                <div className="loading">
                    <h2>Loading assignments...</h2>
                    <p>Please wait while we fetch your assignments.</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container">
                <div className="error-container">
                    <h2>Error Loading Assignments</h2>
                    <p className="error-message">{error}</p>
                    <div className="error-help">
                        <h3>Troubleshooting:</h3>
                        <ul>
                            <li>Check if the backend server is running (port 3001)</li>
                            <li>Verify MySQL connection</li>
                            <li>Ensure database name is correct</li>
                        </ul>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container">
            <h1 className="page-title">Assignments</h1>
            <div className="assignments-list">
                {assignments.length === 0 ? (
                    <p className="no-assignments">No assignments found for your class.</p>
                ) : (
                    assignments.map(assignment => (
                        <div 
                            key={assignment.assignment_id}
                            className={`assignment-card ${expandedId === assignment.assignment_id ? 'expanded' : ''}`}
                            onClick={(e) => toggleExpand(assignment.assignment_id, e)}
                        >
                            <div className="assignment-header">
                                <h3 className="assignment-title">{assignment.title}</h3>
                                <span className="expand-icon">
                                    {expandedId === assignment.assignment_id ? '▼' : '▶'}
                                </span>
                            </div>
                            
                            {expandedId === assignment.assignment_id && (
                                <div className="assignment-details">
                                    <p className="description">
                                        {assignment.description || 'No description provided'}
                                    </p>
                                    
                                    <div className="info-grid">
                                        <div className="info-item">
                                            <strong>Team Size:</strong>
                                            <span>{assignment.min_team_size} - {assignment.max_team_size} members</span>
                                        </div>
                                        
                                        <div className="info-item">
                                            <strong>Deadline:</strong>
                                            <span>
                                                {assignment.deadline ? 
                                                    new Date(assignment.deadline).toLocaleDateString('en-US', {
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric'
                                                    }) : 'No deadline set'}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div className="important-notes">  
                                        <h4>Important Notes:</h4>
                                        <ul>
                                            <li>Submit your work before the deadline</li>
                                            <li>Form teams within the size limits</li>
                                            <li>Review description thoroughly</li>  
                                        </ul>
                                    </div>

                                    <button 
                                        className="view-details-btn"
                                        onClick={(e) => handleViewDetails(e, assignment)}
                                    >
                                        View Teams and More
                                    </button>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

const App = () => {
    return (
        <Routes>
            <Route index element={<StudentAssignments />} />
            <Route path="details/:assignmentId" element={<AssignmentDetails />} />
        </Routes>
    );
};

export default App;
