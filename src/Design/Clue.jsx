import React, {useState} from "react";
import EditIcon from '@material-ui/icons/Edit';

const Clue = ({ clue, handleClueClick, selected, secondary, setRef }) => {
    const [editMode, setEditMode] = useState(false);
    const [inputText, setInputText] = useState(clue);
    // pass in a method for updating the clue and saving the game

    const handleChange = event => setInputText(event.target.value);

    return <li
        style={{
            ...(selected ? { backgroundColor: '#85dcb0' } :
                secondary ? { backgroundColor: '#85dcb0', opacity: '50%' } : {}),
            cursor: 'pointer',
            outline: 'none',
            display: 'flex',
            padding: '5px 10px 5px 1px'
        }}
        key={clue.id}
        id={clue.id}
        selected={selected}
        onClick={() => handleClueClick(clue.tile)}
        ref={setRef}
        tabIndex='-1'>
        <span style={{ fontWeight: 'bold',
            textAlign: 'right',
            minWidth: '24px',
            width: '24px'
        }}>{clue.clueNumber}</span>
        <span style={{
            marginLeft: '10px'
        }}>{ editMode ?
            <input type="text" onChange={handleChange}></input> :
            clue.clue }</span><EditIcon /> // figure out how to align self end
    </li>
}

export default Clue;
