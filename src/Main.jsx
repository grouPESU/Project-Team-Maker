import { useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { useNavigate, useLocation} from "react-router-dom";
import styles from "./main.module.css"
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { io } from "socket.io-client";
import Profile from "./Profile"
import Request from "./Request"
import Invite from "./Invite"
import loginStyles from "./login.module.css"

function Nav({state,assignmentInfo, addTeam}) {
    const { logout, user } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };
    const isUserLeader = Object.values(state.columns).some(column => 
        column.memberRoles && column.memberRoles[user.id] === 'leader'
    );
    
    const students = state.columns.nameList.order;
    console.log("am i a leader",isUserLeader)
    return (
        <div className={styles.nav}>
        <div className={styles.titlecard}>
        <h1>{assignmentInfo?.assignmentTitle || 'No Assignment Selected'}</h1>
        {assignmentInfo?.assignmentDescription && (
            <p className={styles.description}>{assignmentInfo.assignmentDescription}</p>
        )}
        </div>
        <div className={styles.navControls}>
        {isUserLeader ? <Request /> : <Invite />}
        <button className={styles.viewButton} onClick={addTeam}>Add Team</button>
        </div>
        <div className={styles.bruh}>
        <h1> Ungrouped Students </h1>
        <Droppable droppableId="nameList">
        {(provided)=> (
            <ul ref={provided.innerRef} {...provided.droppableProps}>
            {students.map((studentName, index) => 
                <Draggable key={studentName} draggableId={studentName} index={index}>
                {(provided)=> (
                    <li ref={provided.innerRef} {...provided.dragHandleProps} {...provided.draggableProps}>
                    <Member num={state.students[studentName]?.name} />
                    </li>
                )}
                </Draggable>
            )}
            {provided.placeholder}
            </ul>
        )}
        </Droppable>
        </div> 
        </div>
    );
}

function Team({index, teamId, state, allStudents, onDeleteTeam, pendingRequests, pendingInvites}) {
    const [memberCount, setMemberCount] = useState(0);
    const { logout, user } = useAuth();
    useEffect(() => {
        const fetchMemberCount = async () => {
            try {
                const response = await fetch(`http://localhost:3001/api/teams/${teamId}/count`);
                const data = await response.json();
                setMemberCount(data.count);
            } catch (error) {
                console.error('Error fetching member count:', error);
            }
        };

        fetchMemberCount();
    }, [teamId, state.columns[teamId]?.order]);
    const handleDelete = async () => {
        try {
            const response = await fetch(`http://localhost:3001/api/teams/${teamId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to delete team');
            }

            onDeleteTeam(teamId);
        } catch (error) {
            console.error('Error deleting team:', error);
            alert('Failed to delete team');
        }
    };
    return (
        <div className={styles.teamContainer}>

        <button 
        className={styles.deleteTeamButton}
        onClick={handleDelete}
        title="Delete Team"
        >
        ×
        </button>
        <Droppable droppableId={teamId}>
        {(provided) => (
            <ul className={styles.team} ref={provided.innerRef} {...provided.droppableProps}>
        <div className={styles.teamIdOverlay}>
            <div className={styles.iD}>
        ID: {teamId} <span className={styles.memberCount}>({memberCount} members)</span>
            </div>
        </div>
            {state.columns[teamId]?.order.length > 0 ? (
                // Use Set to ensure unique values in the order array
                state.columns[teamId].order.map((studentName, index) => (
                    <Draggable key={studentName} draggableId={studentName} index={index}>
                    {(provided) => (
                        <li
                        ref={provided.innerRef}
                        {...provided.dragHandleProps}
                        {...provided.draggableProps}
                        >
                        <Member 
                        num={allStudents.students[studentName]?.name}
                        isPending={pendingRequests.some(req => 
                            req.student_id === studentName && 
                            req.team_id === teamId && 
                            req.status === 'pending'
                        )}
                        isPendingInvite={pendingInvites.some(inv => 
                                    inv.student_id === studentName && 
                                    inv.team_id === teamId && 
                            inv.status === 'pending'

                        )}
                        isLeader={state.columns[teamId]?.memberRoles?.[studentName] === 'leader'}
                        />
                        </li>
                    )}
                    </Draggable>
                ))
            ) : (
                <li>No members available</li>
            )}
            {provided.placeholder}
            </ul>
        )}
        </Droppable>
        </div>
    );
}

function View({state, setState, teamMembers, allStudents, pendingRequests, pendingInvites, socket}) {
    const [teams, setTeams] = useState([]);
    
    const handleDeleteTeam = async (teamId) => {
        try {
            const teamMembersToMove = [
                ...(state.columns[teamId]?.order || []),
                ...(teamMembers[teamId]?.order || [])
            ];
            console.log("breh", teamMembersToMove)

            const uniqueTeamMembers = [...new Set(teamMembersToMove)];
            
            const response = await fetch(`http://localhost:3001/api/teams/${teamId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to delete team');
            }

            setTeams(prevTeams => prevTeams.filter(id => id !== teamId));

            setState(prevState => {
                const newNameListOrder = [...new Set([
                    ...prevState.columns.nameList.order,
                    ...uniqueTeamMembers
                ])];

                const newState = {
                    ...prevState,
                    columns: {
                        ...prevState.columns,
                        nameList: {
                            ...prevState.columns.nameList,
                            order: newNameListOrder
                        }
                    }
                };

                delete newState.columns[teamId];

                return newState;
            });

            if (socket) {
                socket.emit('teamUpdate', {
                    type: 'teamDeleted',
                    teamId,
                    teamMembers: uniqueTeamMembers
                });
            }

        } catch (error) {
            console.error('Error deleting team:', error);
            alert('Failed to delete team');
        }
    };

    useEffect(() => {
        const existingTeamIds = Object.keys(teamMembers);
        setTeams(existingTeamIds);
    }, [teamMembers]);

    return (
        <div className={styles.groupview}>
            <div className={styles.groupnav}>
                <div className={styles.coolText}>
                    <h1 className={loginStyles.logo}>grouPES</h1>
                </div>
                <Profile />
            </div>
            <div className={styles.grouplist}>
                {teams.map((teamId) => (
                    <Team 
                        key={teamId} 
                        teamId={teamId} 
                        state={state}
                        onDeleteTeam={handleDeleteTeam}
                        pendingRequests={pendingRequests}
                        pendingInvites={pendingInvites}
                        allStudents={allStudents}
                    />
                ))}
            </div>
        </div>
    );
}


function Member({num, isPending, isPendingInvite, isLeader}) {
    return (
        <div className={`${styles.member} 
            ${isPending ? styles.pendingRequest : ''} 
            ${isPendingInvite ? styles.pendingRequest : ''}`}>
        {num} {isLeader ? '👑' : ""}
        </div>
    )
}
export default function Main() {
    const [teams, setTeams] = useState([]);
    const [state, setState] = useState({
        students: {},
        columns: {
            nameList: { title: "nameList", order: [] }
        }
    });
    const [allStudents, setAllStudents] = useState({});
    const [teamMembers, setTeamMembers] = useState({});
    const [pendingInvites, setPendingInvites] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [socket, setSocket] = useState(null);
    const { user } = useAuth();
    const location = useLocation();
    const assignmentInfo = location.state || {};
    useEffect(() => {
        const fetchPendingInvites = async () => {
            try {
                const response = await fetch('http://localhost:3001/api/invites');
                const data = await response.json();
                setPendingInvites(data);
            } catch (error) {
                console.error('Error fetching pending invites:', error);
            }
        };

        fetchPendingInvites();
    }, []);
    console.log(pendingInvites)
    useEffect(() => {
        const fetchPendingRequests = async () => {
            try {
                const response = await fetch('http://localhost:3001/api/joinrequests');
                const data = await response.json();
                setPendingRequests(data);
            } catch (error) {
                console.error('Error fetching pending requests:', error);
            }
        };

        fetchPendingRequests();
    }, []);
    useEffect(() => {
        if (!socket) return;

        socket.on('inviteUpdate', (update) => {
            switch (update.type) {
                case 'newInvite':
                    setPendingInvites(prev => [...prev, update.invite]);
                    break;
                case 'inviteAccepted':
                case 'inviteRejected':
                    setPendingInvites(prev => 
                        prev.filter(inv => 
                            !(inv.student_id === update.studentId && 
                                inv.team_id === update.teamId)
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
        const newSocket = io('http://localhost:3001');
        setSocket(newSocket);
        return () => newSocket.disconnect();
    }, []);
    useEffect(() => {
        if (!socket) return;

        socket.on('requestUpdate', (update) => {
            switch (update.type) {
                case 'newRequest':
                    setPendingRequests(prev => [...prev, update.request]);
                    break;
                case 'requestAccepted':
                case 'requestRejected':
                    setPendingRequests(prev => 
                        prev.filter(req => 
                            !(req.student_id === update.studentId && 
                                req.team_id === update.teamId)
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
        if (!socket) return;

        socket.on('teamUpdate', (update) => {
            switch (update.type) {

                case 'memberAdded':
                    if (update.initiator !== socket.id) {
                        setState(prevState => {
                            const newState = { ...prevState };
                            // Remove from nameList if present
                            newState.columns.nameList.order = [...new Set(
                                newState.columns.nameList.order.filter(id => id !== update.studentId)
                            )];
                            // Add to team if not already present
                            if (!newState.columns[update.teamId]) {
                                newState.columns[update.teamId] = { title: update.teamId, order: [] };
                            }
                            if (!newState.columns[update.teamId].order.includes(update.studentId)) {
                                newState.columns[update.teamId].order = [...new Set([
                                    ...newState.columns[update.teamId].order,
                                    update.studentId
                                ])];
                            }
                            return newState;
                        });
                    }
                    break;

                case 'memberRemoved':
                    setState(prevState => {
                        const newState = { ...prevState };
                        // Remove from team
                        if (newState.columns[update.teamId]) {
                            newState.columns[update.teamId].order = newState.columns[update.teamId].order
                                .filter(id => id !== update.studentId);
                        }
                        // Add to nameList without duplicates
                        newState.columns.nameList.order = [...new Set([
                            ...newState.columns.nameList.order,
                            update.studentId
                        ])];
                        return newState;
                    });
                    break;


                case 'teamCreated':
                    // Only update if you didn't create the team
                    if (update.creatorId !== user.id) {
                        setState(prevState => ({
                            ...prevState,
                            columns: {
                                ...prevState.columns,
                                [update.teamId]: update.team,
                                nameList: {
                                    ...prevState.columns.nameList,
                                    order: prevState.columns.nameList.order
                                    .filter(id => id !== update.creatorId)
                                }
                            }
                        }));
                        setTeamMembers(prev => ({
                            ...prev,
                            [update.teamId]: update.team
                        }));
                    }
                    break;
                case 'teamDeleted':
                    setState(prevState => {
                        const newState = { ...prevState };
                        // Move team members back to nameList
                        newState.columns.nameList.order = [
                            ...new Set([
                                ...newState.columns.nameList.order,
                                ...update.teamMembers
                            ])
                        ];
                        delete newState.columns[update.teamId];
                        return newState;
                    });
                    setTeamMembers(prev => {
                        const newTeamMembers = { ...prev };
                        delete newTeamMembers[update.teamId];
                        return newTeamMembers;
                    });
                    break;
            }
        });

        return () => {
            socket.off('teamUpdate');
        };
    }, [socket]);
    useEffect(() => {
        const fetchTeamsAndMembers = async () => {
            try {
                // Fetch teams first
                const teamResponse = await fetch(`http://localhost:3001/api/teamsync/${assignmentInfo.assignmentId}`);
                const teamData = await teamResponse.json();
                setTeamMembers(teamData);

                // Then fetch students
                const studentsResponse = await fetch(`http://localhost:3001/api/students/${assignmentInfo.assignmentId}`);

                const studentsData = await studentsResponse.json();

                const allResponse = await fetch(`http://localhost:3001/api/students/getall`)
                const allData = await allResponse.json();
                setAllStudents(allData);
                setState(prevState => ({
                    ...studentsData,
                    columns: {
                        ...studentsData.columns,
                        ...teamData  // Merge teams into columns
                    }
                }));
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchTeamsAndMembers();
    }, []);
    const onDragEnd = async (result) => {
        const { destination, source, draggableId } = result;
        if (!destination) return;

        if (
            destination.droppableId === source.droppableId &&
            destination.index === source.index
        ) {
            return;
        }

        // Check drag permissions
        const checkDragPermission = (teamId) => {
            if (teamId === 'nameList') return true;
            const teamInfo = state.columns[teamId];
            const userRole = teamInfo.memberRoles?.[user.id] || 'member';
            const isDraggingOwnName = draggableId === user.id;
            const isLeader = userRole === 'leader';
            return isLeader || isDraggingOwnName;
        };

        if (!checkDragPermission(source.droppableId)) {
            alert("You don't have permission to move this member.");
            return;
        }

        if (!checkDragPermission(destination.droppableId)) {
            alert("You don't have permission to add members to this team.");
            return;
        }

        const start = state.columns[source.droppableId];
        const finish = state.columns[destination.droppableId];

        if (start === finish) return;

        try {
            // Update local state
            const startOrder = Array.from(start.order);
            startOrder.splice(source.index, 1);
            const newStart = {
                ...start,
                order: startOrder,
            };

            const finishOrder = Array.from(finish.order);
            finishOrder.splice(destination.index, 0, draggableId);
            const newFinish = {
                ...finish,
                order: finishOrder,
            };

            const newState = {
                ...state,
                columns: {
                    ...state.columns,
                    [newStart.title]: newStart,
                    [newFinish.title]: newFinish,
                },
            };

            setState(newState);

            // Moving from nameList to a team
            if (source.droppableId === 'nameList' && destination.droppableId !== 'nameList') {
                const teamInfo = state.columns[destination.droppableId];
                const isLeader = teamInfo.memberRoles?.[user.id] === 'leader';

                if (isLeader) {
                    // Leader is dragging someone in - create invitation
                    await fetch('http://localhost:3001/api/invites', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            studentId: draggableId,
                            teamId: destination.droppableId,
                            status: 'pending'
                        }),
                    });

                    if (socket) {
                        socket.emit('inviteUpdate', {
                            type: 'newInvite',
                            invite: {
                                student_id: draggableId,
                                team_id: destination.droppableId,
                                status: 'pending'
                            }
                        });
                    }

                    const memberElem = document.querySelector(`[data-rbd-draggable-id="${draggableId}"]`);
                    if (memberElem) {
                        memberElem.firstChild.classList.add(styles.pendingInvite);
                    }
                } else {
                    // Regular member dragging themselves - create join request
                    await fetch('http://localhost:3001/api/joinrequests', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            studentId: user.id,
                            teamId: destination.droppableId
                        }),
                    });

                    const memberElem = document.querySelector(`[data-rbd-draggable-id="${draggableId}"]`);
                    if (memberElem) {
                        memberElem.firstChild.classList.add(styles.pendingRequest);
                    }
                }
            } 
            else if (source.droppableId !== 'nameList' && destination.droppableId === 'nameList') {
                const sourceTeamInfo = state.columns[source.droppableId];
                const destTeamInfo = state.columns[destination.droppableId];
                await fetch(`http://localhost:3001/api/teams/${source.droppableId}/members/${draggableId}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        socketId: socket.id
                    }),
                });
                // Can't move the leader
                if (sourceTeamInfo.memberRoles?.[draggableId] === 'leader') {
                    alert("Team leader cannot be moved to another team");
                    setState(state);
                    return;
                }
            }

        } catch (error) {
            console.error('Error updating team members:', error);
            setState(state);
        }
    };


    const handleTeamCreated = (update) => {
        const { teamId, team, creatorId } = update;

        setTeams(prevTeams => {
            // Only add if it's not already in the array
            if (!prevTeams.includes(teamId)) {
                return [...prevTeams, teamId];
            }
            return prevTeams;
        });

        setState(prevState => {
            // If the team is already in state, don't add it again
            if (prevState.columns[teamId]) {
                return prevState;
            }

            const newState = {
                ...prevState,
                columns: {
                    ...prevState.columns,
                    [teamId]: {
                        title: teamId,
                        order: [creatorId]
                    }
                }
            };

            // Only remove from nameList if it's the current user's team
            if (creatorId === user.id) {
                newState.columns.nameList.order = 
                    newState.columns.nameList.order.filter(id => id !== creatorId);
            }

            return newState;
        });
    };
    const addTeam = async () => {
        try {
            const response = await fetch('http://localhost:3001/api/teams', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    creatorId: user.id,
                    assignmentId: assignmentInfo.assignmentId
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                if (data.alreadyInTeam) {
                    alert(data.error);
                    return;
                }
                throw new Error(data.error || 'Failed to create team');
            }

            const newTeamId = data.teamId;

            // Immediately update the state with the new team
            setState(prevState => {
                // Only update if the team doesn't already exist
                if (prevState.columns[newTeamId]) {
                    return prevState;
                }

                return {
                    ...prevState,
                    columns: {
                        ...prevState.columns,
                        [newTeamId]: {
                            title: newTeamId,
                            order: [user.id],
                            memberRoles: {
                                [user.id]: 'leader'
                            }
                        },
                        nameList: {
                            ...prevState.columns.nameList,
                            order: prevState.columns.nameList.order.filter(id => id !== user.id)
                        }
                    }
                };
            });

            // Update teamMembers state as well
            setTeamMembers(prev => ({
                ...prev,
                [newTeamId]: {
                    title: newTeamId,
                    order: [user.id],
                    memberRoles: {
                        [user.id]: 'leader'
                    }
                }
            }));

            // Only emit if the state update was successful
            if (socket) {
                socket.emit('teamUpdate', {
                    type: 'teamCreated',
                    teamId: newTeamId,
                    team: {
                        title: newTeamId,
                        order: [user.id],
                        memberRoles: {
                            [user.id]: 'leader'
                        }
                    },
                    creatorId: user.id
                });
            }

        } catch (error) {
            console.error('Error creating team:', error);
            alert('An error occurred while creating the team');
        }
    };
    return (
        <DragDropContext onDragEnd={onDragEnd}>
        <div className= {styles.mainbody} >
        <Nav state={state} assignmentInfo={assignmentInfo} addTeam={addTeam}/>
        <View 
        state={state} 
        setState={setState} 
        teamMembers={teamMembers} 
        assignmentInfo={assignmentInfo}
        pendingRequests={pendingRequests}
        pendingInvites={pendingInvites}
        allStudents={allStudents}
        socket={socket}
        />
        </div>
        </DragDropContext>
    );
}
