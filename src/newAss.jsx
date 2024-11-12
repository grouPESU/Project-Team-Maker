import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import assnStyles from './newass.module.css';
import Profile from "./Profile"

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
                const response = await fetch(`http://localhost:3006/student/assignments/${assignmentId}`);
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
            <div className={assnStyles.container}>
            <div className={assnStyles.loading}>
            <h2>Loading assignment details...</h2>
            </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={assnStyles.container}>
            <div className={assnStyles.errorContainer}>
            <h2>Error Loading Assignment Details</h2>
            <p className={assnStyles.errorMessage}>{error}</p>
            <button 
            className={assnStyles.backButton}
            onClick={() => navigate('/')}
            >
            Back to Assignments
            </button>
            </div>
            </div>
        );
    }

    return (
        <div className={assnStyles.container}>
        <div className={assnStyles.assignmentDetailsPage}>
        <button 
        className={assnStyles.backButton}
        onClick={() => navigate('/')}
        >
        ← Back to Assignments
        </button>

        {assignment ? (
            <>
            <h1>{assignment.title}</h1>
            <div className={assnStyles.detailsContent}>
            <section className={assnStyles.descriptionSection}>
            <h2>Description</h2>
            <p>{assignment.description || 'No description provided'}</p>
            </section>

            <section className={assnStyles.teacherSection}>
            <h2>Instructor</h2>
            <p>{assignment.teacher_name}</p>
            </section>

            <section className={assnStyles.teamSection}>
            <h2>Team Requirements</h2>
            <p>Team Size: {assignment.min_team_size} - {assignment.max_team_size} members</p>
            <p>Class: {assignment.class}</p>
            </section>

            <section className={assnStyles.deadlineSection}>
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
        if (event.target.closest(`.${assnStyles.viewDetailsBtn}`)) {
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
            <div className={assnStyles.container}>
            <div className={assnStyles.loading}>
            <h2>Loading assignments...</h2>
            <p>Please wait while we fetch your assignments.</p>
            </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={assnStyles.container}>
            <div className={assnStyles.errorContainer}>
            <h2>Error Loading Assignments</h2>
            <p className={assnStyles.errorMessage}>{error}</p>
            <div className={assnStyles.errorHelp}>
            <h3>Troubleshooting:</h3>
            <ul>
            <li>Looks like you've no assignments!</li>
            <li>Go enjoy life dear student</li>
            <li>The chances of you getting this opportunity again are really slim</li>
            </ul>
            </div>
            </div>
            </div>
        );
    }

    return (
        <div className={assnStyles.main}>
        <div className={assnStyles.header}>
        <Profile />
        </div>
        <div className={assnStyles.container}>
        <h1 className={assnStyles.pageTitle}>Assignments</h1>
        <div className={assnStyles.assignmentsList}>
        {assignments.length === 0 ? (
            <p className={assnStyles.noAssignments}>No assignments found for your class.</p>
        ) : (
            assignments.map(assignment => (
                <div 
                key={assignment.assignment_id}
                className={`${assnStyles.assignmentCard} ${expandedId === assignment.assignment_id ? assnStyles.expanded : ''}`}
                onClick={(e) => toggleExpand(assignment.assignment_id, e)}
                >
                <div className={assnStyles.assignmentHeader}>
                <h3 className={assnStyles.assignmentTitle}>{assignment.title}</h3>
                <span className={assnStyles.expandIcon}>
                {expandedId === assignment.assignment_id ? '▼' : '▶'}
                </span>
                </div>

                {expandedId === assignment.assignment_id && (
                    <div className={assnStyles.assignmentDetails}>
                    <p className={assnStyles.description}>
                    {assignment.description || 'No description provided'}
                    </p>

                    <div className={assnStyles.infoGrid}>
                    <div className={assnStyles.infoItem}>
                    <strong>Team Size:</strong>
                    <span>{assignment.min_team_size} - {assignment.max_team_size} members</span>
                    </div>

                    <div className={assnStyles.infoItem}>
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

                    <div className={assnStyles.importantNotes}>  
                    <h4>Important Notes:</h4>
                    <ul>
                    <li>Submit your work before the deadline</li>
                    <li>Form teams within the size limits</li>
                    <li>Review description thoroughly</li>  
                    </ul>
                    </div>

                    <button 
                    className={assnStyles.viewDetailsBtn}
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
