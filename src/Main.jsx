import { useState, useEffect } from "react";
import "./main.css"
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import testData from "./testData.js";

function Nav({state}) {
    const students = state.columns.nameList.order;
    return (
        <div className="nav">
            <div className="titlecard">
                <h1>TITLE</h1>
            </div>
            <div className="bruh">
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

function Team({index, teamId, state}) {
    return (
        <Droppable droppableId={teamId}>
            {(provided)=> (
                <ul className="team" ref={provided.innerRef} {...provided.droppableProps}>
                    {state.columns[teamId]?.order.length > 0 ? (
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
    )
}

function View({state, setState}) {
    const [teams, setTeams] = useState([]);

    const addTeam = () => {
        const newTeamId = `team-${teams.length + 1}`;
        setTeams([...teams, newTeamId]);
        
        // Update the state to include the new team
        setState(prevState => ({
            ...prevState,
            columns: {
                ...prevState.columns,
                [newTeamId]: { title: newTeamId, order: [] }
            }
        }));
    }

    return (
        <div className="groupview">
            <div className="groupnav">
                <button className="button-85" onClick={addTeam}>Add Team</button>
            </div>
            <div className="grouplist">
                {teams.map((teamId, index) => (
                    <Team key={teamId} teamId={teamId} state={state}/>
                ))}
            </div>
        </div>
    )
}

function Member({num}) {
    return (
        <div className="member">
            {num}
        </div>
    )
}

export default function Main() {
    const [state, setState] = useState({
        students: {},
        columns: {
            nameList: { title: "nameList", order: [] }
        }
    });

    useEffect(() => {
        fetch('http://localhost:3001/api/students')
            .then(response => response.json())
            .then(data => setState(data))
            .catch(error => console.error('Error fetching students:', error));
    }, []);

    const onDragEnd = (result) => {
        const { destination, source, draggableId } = result;
        if (!destination) return;

        if (
            destination.droppableId === source.droppableId &&
            destination.index === source.index
        ) {
            return;
        }

        const start = state.columns[source.droppableId];
        const finish = state.columns[destination.droppableId];

        if (start === finish) {
            return;
        }

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
    };

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <div className="mainbody gradient-background">
                <Nav state={state} />
                <View state={state} setState={setState}/>
            </div>
        </DragDropContext>
    );
}
