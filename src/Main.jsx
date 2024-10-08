import { useState } from "react";
import "./main.css"
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import testData from "./testData.js";


function Nav({students}) {
    console.log(students)
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

function Team({index,teamId}) {
    return (
        <Droppable droppableId={teamId}>
        {(provided)=> (

        <div className="team" ref={provided.innerRef} {...provided.droppableProps}>

            {provided.placeholder}
        </div>
        )}
        </Droppable>
    )
}

function View() {
    const [teams, setTeams] = useState([]);

    const addTeam = () => {
        setTeams([...teams, `team-${teams.length + 1}`]);  // Assign unique ID based on team number
        console.log(`team-${teams.length + 1}`)
    }
    return (
        <div className="groupview">
        <div className="groupnav">

        <button onClick={addTeam}>Add Team</button>
        </div>
        <div className="grouplist">
        {teams.map((teamId,index)=>(
            <Team key={index} teamId={teamId}/>
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
    const [state, setState] = useState(testData);
    const nameList = Object.values(state.students).map(student => student.name);
    const [nameState, nameSetState] = useState(nameList);
    const onDragEnd = result => {
        const {destination, source, draggableId} = result;
        console.log("ID",draggableId)
        if (!destination) return;
        if (destination.droppableId == source.droppableId &&
            destination.index == source.index) {
            return;
        }
        if (destination.droppableId == "nameList") {
            const newNameState = Array.from(nameState);  // Create a new array from nameState
            const [removed] = newNameState.splice(source.index, 1);  // Remove the item from the source index
            newNameState.splice(destination.index, 0, removed);  // Insert it at the destination index

            nameSetState(newNameState);
            console.log(nameState)
            return;
        }
        const start = state.columns[source.droppableId];
        const finish = state.columns[destination.droppableId];
        console.log("start", start.order);
        console.log("end",finish.order)
        if(start == finish){
            const newArr = Array.from(Object.values(start).order);
            const [draggedItem] = newArr.splice(source.index,1);
            newArr.splice(destination.index,0,draggedItem);
            const newCol = {
                ...start,
                order: newArr,
            };
            const newState = {
                ...this.state,
                [newCol.id]: newCol,

            }
            setState(newState);
            return ;

        }
        console.log("Hello")
        const startOrder = Array.from(start.order);
        startOrder.splice(source.index,1);
        console.log("startOrder",startOrder)
        const newStart = {
            ...start,
            order: startOrder,
        };
        console.log("finish",finish)
        const finishOrder = Array.from(finish.order);
        finishOrder.splice(destination.index,0,draggableId);
        console.log("finOrder",finishOrder)
        const newFin = {
            ...finish,
            order: finishOrder,
        };
        console.log("newFin",newFin.title);

        const newState = {
            ...state,
            columns: {
                ...state.columns,
                [newStart.title] : newStart,
                [newFin.title] : newFin,
            },
        };
        console.log("state",newState)
        setState(newState);
        

    }
    return (
        <DragDropContext onDragEnd={onDragEnd}>
        <div className="body">
        <Nav students={nameState}/>
        <View />
        </div>
        </DragDropContext>
    );
}
