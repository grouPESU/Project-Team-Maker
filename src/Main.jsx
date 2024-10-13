import { useState,useEffect } from "react";
import "./main.css"
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import testData from "./testData.js";


function Nav({state}) {
    const students = state.columns.nameList.order;
    console.log(state.students)
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

                    <li  ref={provided.innerRef} {...provided.dragHandleProps} {...provided.draggableProps}>

                    <Member num={studentName} />
                    </li>
                ) }
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

function Team({index,teamId,state}) {
    console.log("finalstate", state)
    return (
        <Droppable droppableId={teamId}>
        {(provided)=> (
            <ul className="team" ref={provided.innerRef} {...provided.droppableProps}>
            {state.columns[teamId].order.length > 0 ? (
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
                <li>No members available</li> // Placeholder message for empty array
    )}
    {provided.placeholder}
</ul>
        )}
        </Droppable>
    )
}

function View({state}) {
    const [teams, setTeams] = useState([]);

    const addTeam = () => {
        setTeams([...teams, `team-${teams.length + 1}`]);  // Assign unique ID based on team number
    }
    return (
        <div className="groupview">
        <div className="groupnav">

        <button className="button-85" onClick={addTeam}>Add Team</button>
        </div>
        <div className="grouplist">
        {teams.map((teamId,index)=>(
            <Team key={index} teamId={teamId} state={state}/>
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
        nameList: { title: "nameList", order: [] },
        'team-1': { title: "team-1", order: [] },
        'team-2': { title: "team-2", order: [] },
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

        // If the item was dropped back into the same place, do nothing
        if (
            destination.droppableId === source.droppableId &&
            destination.index === source.index
        ) {
            return;
        }

        const start = state.columns[source.droppableId];
        const finish = state.columns[destination.droppableId];

        console.log("I'm starting from; ", start.title, "and ending at: ",finish.title)
        // Moving within the same column
        if (start.title === finish.title) {
            const newOrder = Array.from(start.order);
            const [draggedItem] = newOrder.splice(source.index, 1);
            newOrder.splice(destination.index, 0, draggedItem);

            const newCol = {
                ...start,
                order: newOrder,
            };

            const newState = {
                ...state,
                columns: {
                    ...state.columns,
                    [newCol.title]: newCol,
                },
            };

            setState(newState);
            return;
        }

        // Moving to a different column
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
            <div className="body gradient-background">
                <Nav state={state} />
                <View state={state}/>
            </div>
        </DragDropContext>
    );
}
