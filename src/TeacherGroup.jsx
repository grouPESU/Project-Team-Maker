import { useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { useNavigate, useLocation} from "react-router-dom";
import styles from "./main.module.css"
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { io } from "socket.io-client";


function useClickEffect() {
    useEffect(() => {
        const clickEffect = (e) => {
            const d = document.createElement("div");
            d.className = styles.clickEffect; // Use CSS module class
            d.style.top = `${e.clientY}px`;
            d.style.left = `${e.clientX}px`;
            document.body.appendChild(d);

            const removeDiv = () => {
                d.removeEventListener('animationend', removeDiv);
                d.parentElement?.removeChild(d);
            };

            d.addEventListener('animationend', removeDiv);
        };

        document.addEventListener('click', clickEffect);

        // Cleanup listener on component unmount
        return () => {
            document.removeEventListener('click', clickEffect);
        };
    }, []); // Empty dependency array means this runs once on mount
}
function Nav({state,assignmentInfo}) {
    const { logout, user } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const students = state.columns.nameList.order;
    console.log(assignmentInfo)
    return (
        <div className={styles.nav}>
        <div className={styles.titlecard}>
        <h1>{assignmentInfo?.assignmentTitle || 'No Assignment Selected'}</h1>
        {assignmentInfo?.assignmentDescription && (
            <p className={styles.description}>{assignmentInfo.description}</p>
        )}
        </div>
        <div className={styles.navControls}>
        <button className={styles.button85} onClick={handleLogout}>Logout</button>
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
                    <Member num={studentName} />
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

function Team({index, teamId, state, onDeleteTeam}) {
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
        <div className={styles.teamIdOverlay}>
        ID: {teamId}
        </div>

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
                        <Member num={studentName} />
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

function View({state, setState, teamMembers, assignmentInfo}) {
    const [teams, setTeams] = useState([]);
    const { user } = useAuth();

    const handleDeleteTeam = (teamId) => {
        // Update teams state
        setTeams(prevTeams => prevTeams.filter(id => id !== teamId));

        // Update main state
        setState(prevState => {
            const newState = {
                ...prevState,
                columns: {
                    ...prevState.columns,
                    nameList: {
                        ...prevState.columns.nameList,
                        order: [
                            ...prevState.columns.nameList.order,
                            // Add team members back to nameList
                            ...(prevState.columns[teamId]?.order || [])
                        ]
                    }
                }
            };
            // Remove the team from columns
            delete newState.columns[teamId];
            return newState;
        });
    };
    // Use existing teams from backend
    useEffect(() => {
        // This assumes the existing useEffect in Main component
        // is populating teamMembers with backend data
        const existingTeamIds = Object.keys(teamMembers);
        setTeams(existingTeamIds);
    }, [teamMembers]);

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
            setTeams(prevTeams => [...prevTeams, newTeamId]);

            // Update state to reflect new team
            setState(prevState => {
                const newState = {
                    ...prevState,
                    columns: {
                        ...prevState.columns,
                        [newTeamId]: { 
                            title: newTeamId, 
                            order: [user.id] 
                        }
                    }
                };

                // Remove creator from nameList
                newState.columns.nameList.order = newState.columns.nameList.order
                    .filter(id => id !== user.id);

                return newState;
            });
        } catch (error) {
            console.error('Error creating team:', error);
            alert('An error occurred while creating the team');
        }
    };
    return (
        <div className={styles.groupview}>
        <div className={styles.groupnav}>
        <button className={styles.button85} onClick={addTeam}>Add Team</button>
        </div>
        <div className={styles.grouplist}>
        {teams.map((teamId) => (
            <Team 
            key={teamId} 
            teamId={teamId} 
            state={state}
            onDeleteTeam={handleDeleteTeam}
            />
        ))}
        </div>
        </div>
    );
}


function Member({num}) {
    return (
        <div className={styles.member}>
        {num}
        </div>
    )
}export default function Main() {
    const [state, setState] = useState({
        students: {},
        columns: {
            nameList: { title: "nameList", order: [] }
        }
    });
    const [teamMembers, setTeamMembers] = useState({});
    const [socket, setSocket] = useState(null);
    const { user } = useAuth();
    const location = useLocation();
    const assignmentInfo = location.state || {};

    useEffect(() => {
        const newSocket = io('http://localhost:3001');
        setSocket(newSocket);
        return () => newSocket.disconnect();
    }, []);

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
                        if (newState.columns[update.teamId]) {
                            newState.columns.nameList.order = [
                                ...new Set([
                                    ...newState.columns.nameList.order,
                                    ...(update.teamMembers || [])
                                ])
                            ];
                            delete newState.columns[update.teamId];
                        }
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
                console.log(teamData)
                setTeamMembers(teamData);

                // Then fetch students
                const studentsResponse = await fetch(`http://localhost:3001/api/students/${assignmentInfo.assignmentId}`);

                const studentsData = await studentsResponse.json();
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
    console.log(teamMembers)
    const onDragEnd = async (result) => {
        //const { destination, source, draggableId } = result;
        //if (!destination) return;
        //
            //if (
                //    destination.droppableId === source.droppableId &&
                //    destination.index === source.index
                //) {
                //    return;
                //}
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
            // If dragging within nameList, always allowed
            if (teamId === 'nameList') return true;

            // Check if user is a leader or dragging their own name
            const teamInfo = state.columns[teamId];
            const userRole = teamInfo.memberRoles?.[user.id] || 'member';
            console.log(teamInfo.memberRoles)
            const isDraggingOwnName = draggableId === user.id;
            const isLeader = userRole === 'leader';
            console.log(isLeader)

            return isLeader || isDraggingOwnName;
        };

        // Validate source drag permission
        if (!checkDragPermission(source.droppableId)) {
            alert("You don't have permission to move this member.");
            return;
        }

        // Validate destination drag permission
        if (!checkDragPermission(destination.droppableId)) {
            alert("You don't have permission to add members to this team.");
            return;
        }

        const start = state.columns[source.droppableId];
        const finish = state.columns[destination.droppableId];

        if (start === finish) {
            return;
        }

        try {
            // Update local state first
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
                await fetch(`http://localhost:3001/api/teams/${destination.droppableId}/members`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        studentId: draggableId,
                        socketId: socket.id // Send socket ID to identify initiator
                    }),
                });
            } 
            // Moving from a team to nameList
            else if (source.droppableId !== 'nameList' && destination.droppableId === 'nameList') {
                await fetch(`http://localhost:3001/api/teams/${source.droppableId}/members/${draggableId}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        socketId: socket.id
                    }),
                });
            }
        } catch (error) {
            console.error('Error updating team members:', error);
            // Revert state on error
            setState(state);
        }
    };
    useClickEffect();
    return (
        <DragDropContext onDragEnd={onDragEnd}>
        <div className= {styles.mainbody} >
        <Nav state={state} assignmentInfo={assignmentInfo}/>
        <View state={state} setState={setState} teamMembers={teamMembers} assignmentInfo={assignmentInfo}/>
        </div>
        </DragDropContext>
    );
}
