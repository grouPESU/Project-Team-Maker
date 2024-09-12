import { useState } from "react";
import "./main.css"
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

function Nav() {

    function callBack(result) {
        
    }
    const students = [
        {
            id: 1
        },
        {
            id: 2
        },
        {
            id: 3
        },
        {
            id: 4
        },
        {
            id: 5
        },
    ]

    return (
        <div className="nav">
        <div className="titlecard">
        <h1>TITLE</h1>
        </div>
        <div className="bruh">
        <DragDropContext onDragEnd={callBack}>
        <Droppable droppableId="nameList">
        {(provided)=> (
        <ul ref={provided.innerRef} {...provided.droppableProps}>
            {students.map(({id}, index) => 
                <Draggable key={id} draggableId={id.toString()} index={index}>
                {(provided)=> (

                    <li  ref={provided.innerRef} {...provided.dragHandleProps} {...provided.draggableProps}>

                    <Member num={id} />
                    </li>
                ) }
                </Draggable>
            )}

            {provided.placeholder}
        </ul>

        )}
        </Droppable>
        </DragDropContext>
        </div> 
        </div>
    );
}

function Team({key}) {
    return (
        <div className="team">
            
        </div>
    )
}

function View() {
    const [teams, setTeams] = useState([]);

    const addTeam = () => {
        setTeams([...teams, {}]);
    }
    return (
        <div className="groupview">
        <div className="groupnav">

        <button onClick={addTeam}>Add Team</button>
        </div>
        <div className="grouplist">
        {teams.map((_, index)=>(
            <Team key={index}/>
        ))}
        </div>
        </div>

    )
}



function Member({num}) {
    return (
        <div className="member">
            Member {num}
        </div>
    )
}

export default function Main() {
    return (
        <div className="body">
        <Nav />
        <View />
        </div>
    );
}
