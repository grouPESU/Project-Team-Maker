// src/Assn.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, Routes, Route, useParams } from 'react-router-dom';
import styles from './assign.module.css';

// Student Assignments List Component
const StudentAssignmentsList = () => {
    const [assignments, setAssignments] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const testDatabaseConnection = async () => {
            try {
                const response = await fetch('http://localhost:3006/api/test-db');
                const data = await response.json();
                console.log('Database connection test:', data);
                if (!response.ok) {
                    throw new Error('Database connection failed');
                }
            } catch (err) {
                console.error('Database connection test failed:', err);
                setError('Database connection failed. Please check if the server is running.');
                return false;
            }
            return true;
        };

        const fetchAssignments = async () => {
            try {
                setLoading(true);
                setError(null);
                const isDbConnected = await testDatabaseConnection();
                if (!isDbConnected) return;

                const response = await fetch('http://localhost:3006/student/assignments');
                console.log('Response status:', response.status);
                
                const data = await response.json();
                console.log('Response data:', data);

                if (!response.ok) {
                    throw new Error(data.error || 'Failed to fetch assignments');
                }

                if (Array.isArray(data)) {
                    setAssignments(data);
                } else {
                    console.error('Unexpected data format:', data);
                    throw new Error('Invalid data format received from server');
                }
            } catch (err) {
                console.error('Error fetching assignments:', err);
                setError(err.message || 'Failed to fetch assignments');
            } finally {
                setLoading(false);
            }
        };

        fetchAssignments();
    }, []);

    const handleAssignmentClick = (assignment) => {
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
            <div className={styles.assignmentsContainer}>
                <h1>Loading assignments...</h1>
                <p>Please wait while we fetch your assignments.</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`${styles.assignmentsContainer} ${styles.error}`}>
                <h1>Error Loading Assignments</h1>
                <p className={styles.errorMessage}>{error}</p>
                <div className={styles.debugInfo}>
                    <h3>Debug Information:</h3>
                    <p>If you're seeing this, you're probably DUMB. Please check if:</p>
                    <ul>
                        <li>The backend server is running on port 3001</li>
                        <li>MySQL server is running</li>
                        <li>Database 'dbms_project' is changed to the respective one in your system.</li>
                    </ul>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.assignmentsContainer}>
            <h1>Assignments</h1>
            {assignments.length === 0 ? (
                <p>No assignments found for your class.</p>
            ) : (
                <ul className={styles.assignmentsList}>
                    {assignments.map(assignment => (
                        <li 
                            key={assignment.assignment_id} 
                            onClick={() => handleAssignmentClick(assignment)}
                            className={styles.assignmentItem}
                        >
                            {assignment.title}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

// Assignment Details Component
const AssignmentDetails = () => {
    const { assignmentId } = useParams();
    return (
        <div className={styles.assignmentDetails}>
            <h2>Assignment Details</h2>
            <p>Details for assignment {assignmentId} will appear here. (in this case, the ungrouped and teams)</p>
        </div>
    );
};

// Main Assn Component
const Assn = () => {
    return (
        <Routes>
            <Route index element={<StudentAssignmentsList />} />
            <Route path="details/:assignmentId" element={<AssignmentDetails />} />
        </Routes>
    );
};

export default Assn;
