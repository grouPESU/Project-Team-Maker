import React, { useState, useEffect } from 'react';
import styles from './main.module.css';
import { useAuth } from './AuthContext';
import { io } from 'socket.io-client';

const Invite = () => {
    const [showInvites, setShowInvites] = useState(false);
    const [invites, setInvites] = useState([]);
    const { user } = useAuth();
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        const newSocket = io('http://localhost:3001');
        setSocket(newSocket);

        return () => newSocket.disconnect();
    }, []);

    useEffect(() => {
        if (!socket) return;

        socket.on('inviteUpdate', (update) => {
            switch (update.type) {
                case 'newInvite':
                    fetchInvites(); // Refresh all invites
                    break;
                case 'inviteAccepted':
                case 'inviteRejected':
                    setInvites(prevInvites => 
                        prevInvites.filter(inv => 
                            !(inv.student_id === update.studentId && inv.team_id === update.teamId)
                        )
                    );
                    break;
            }
        });

        return () => {
            socket.off('inviteUpdate');
        };
    }, [socket]);

    useEffect(() => {
        fetchInvites();

        const handleClickOutside = (event) => {
            if (showInvites && !event.target.closest(`.${styles.modalContent}`)) {
                setShowInvites(false);
            }
        };

        if (showInvites) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.body.style.overflow = 'unset';
        };
    }, [showInvites]);

    const fetchInvites = async () => {
        try {
            const response = await fetch('http://localhost:3001/api/invites');
            const data = await response.json();
            setInvites(data);
        } catch (error) {
            console.error('Error fetching invites:', error);
        }
    };

    const handleInviteAction = async (inviteId, status) => {
        try {
            const inviteToUpdate = invites.find(inv => inv.invitation_id === inviteId);
            if (!inviteToUpdate) return;

            const response = await fetch(`http://localhost:3001/api/invites/${inviteId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status }),
            });

            if (!response.ok) {
                throw new Error('Failed to update invite');
            }

            // Remove the invite locally
            setInvites(prevInvites => 
                prevInvites.filter(invite => invite.invitation_id !== inviteId)
            );

            // Socket will handle the UI updates for all clients
            socket.emit('inviteUpdate', {
                type: status === 'accepted' ? 'inviteAccepted' : 'inviteRejected',
                studentId: inviteToUpdate.student_id,
                teamId: inviteToUpdate.team_id
            });

        } catch (error) {
            console.error('Error updating invite:', error);
        }
    };

    return (
        <>
        <button 
        className={styles.editButton} 
        onClick={() => setShowInvites(!showInvites)}
        >
        Invites {invites.length > 0 && `(${invites.length})`}
        </button>

        {showInvites && (
            <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
            <h2>Team Invites</h2>
            <button 
            className={styles.closeButton}
            onClick={() => setShowInvites(false)}
            >
            ×
            </button>
            </div>
            <div className={styles.requestsList}>
            {invites.length > 0 ? (
                <ul>
                {invites.map((invite) => (
                    <li key={invite.invitation_id} className={styles.requestItem}>
                    <div className={styles.requestInfo}>
                    <span className={styles.studentName}>
                    {invite.student_name}
                    </span>
                    <span className={styles.teamId}>
                    Team: {invite.team_id}
                    </span>
                    </div>
                    <div className={styles.requestActions}>
                    <button
                    className={`${styles.actionButton} ${styles.acceptButton}`}
                    onClick={() => handleInviteAction(invite.invitation_id, 'accepted')}
                    >
                    Accept
                    </button>
                    <button
                    className={`${styles.actionButton} ${styles.rejectButton}`}
                    onClick={() => handleInviteAction(invite.invitation_id, 'rejected')}
                    >
                    Reject
                    </button>
                    </div>
                    </li>
                ))}
                </ul>
            ) : (
                <p className={styles.noRequests}>No pending invites</p>
            )}
            </div>
            </div>
            </div>
        )}
        </>
    );
};

export default Invite;
