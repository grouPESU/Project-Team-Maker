import React, { useState, useEffect } from 'react';
import styles from './main.module.css';
import { useAuth } from './AuthContext';
import { io } from 'socket.io-client';

const Request = () => {
    const [showRequests, setShowRequests] = useState(false);
    const [requests, setRequests] = useState([]);
    const { user } = useAuth();
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        const newSocket = io('http://localhost:3001');
        setSocket(newSocket);

        return () => newSocket.disconnect();
    }, []);

    useEffect(() => {
        if (!socket) return;

        socket.on('requestUpdate', (update) => {
            switch (update.type) {
                case 'newRequest':
                    fetchRequests(); // Refresh all requests
                    break;
                case 'requestAccepted':
                case 'requestRejected':
                    setRequests(prevRequests => 
                        prevRequests.filter(req => 
                            !(req.student_id === update.studentId && req.team_id === update.teamId)
                        )
                    );
                    break;
            }
        });

        return () => {
            socket.off('requestUpdate');
        };
    }, [socket]);

    useEffect(() => {
        fetchRequests();

        const handleClickOutside = (event) => {
            if (showRequests && !event.target.closest(`.${styles.modalContent}`)) {
                setShowRequests(false);
            }
        };

        if (showRequests) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.body.style.overflow = 'unset';
        };
    }, [showRequests]);

    const fetchRequests = async () => {
        try {
            const response = await fetch('http://localhost:3001/api/joinrequests');
            const data = await response.json();
            setRequests(data);
        } catch (error) {
            console.error('Error fetching requests:', error);
        }
    };

    const handleRequestAction = async (requestId, status) => {
        try {
            const requestToUpdate = requests.find(req => req.request_id === requestId);
            if (!requestToUpdate) return;

            const response = await fetch(`http://localhost:3001/api/joinrequests/${requestId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status }),
            });

            if (!response.ok) {
                throw new Error('Failed to update request');
            }

            // Remove the request locally
            setRequests(prevRequests => 
                prevRequests.filter(request => request.request_id !== requestId)
            );

            // Socket will handle the UI updates for all clients
            socket.emit('requestUpdate', {
                type: status === 'accepted' ? 'requestAccepted' : 'requestRejected',
                studentId: requestToUpdate.student_id,
                teamId: requestToUpdate.team_id
            });

        } catch (error) {
            console.error('Error updating request:', error);
        }
    };

    return (
        <>
        <button 
        className={styles.editButton} 
        onClick={() => setShowRequests(!showRequests)}
        >
        Requests {requests.length > 0 && `(${requests.length})`}
        </button>

        {showRequests && (
            <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
            <h2>Join Requests</h2>
            <button 
            className={styles.closeButton}
            onClick={() => setShowRequests(false)}
            >
            ×
            </button>
            </div>
            <div className={styles.requestsList}>
            {requests.length > 0 ? (
                <ul>
                {requests.map((request) => (
                    <li key={request.request_id} className={styles.requestItem}>
                    <div className={styles.requestInfo}>
                    <span className={styles.studentName}>
                    {request.student_name}
                    </span>
                    <span className={styles.teamId}>
                    Team: {request.team_id}
                    </span>
                    </div>
                    <div className={styles.requestActions}>
                    <button
                    className={`${styles.actionButton} ${styles.acceptButton}`}
                    onClick={() => handleRequestAction(request.request_id, 'accepted')}
                    >
                    Accept
                    </button>
                    <button
                    className={`${styles.actionButton} ${styles.rejectButton}`}
                    onClick={() => handleRequestAction(request.request_id, 'rejected')}
                    >
                    Reject
                    </button>
                    </div>
                    </li>
                ))}
                </ul>
            ) : (
                <p className={styles.noRequests}>No pending requests</p>
            )}
            </div>
            </div>
            </div>
        )}
        </>
    );
};

export default Request;
