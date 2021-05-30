import React, {useState, useRef} from "react";
import EditIcon from '@material-ui/icons/Edit';

import './Clue.css'
import useKeypress from "react-use-keypress";
import { ENTER } from "../Game/constants";
import {arrowKeyPress, clearLetterKey, letterKeyPres, tabKeyPress} from "../Game/handleInput";

const Clue = ({ clue, handleClueClick, selected, secondary, setRef, saveGameWithClue, registerClueActive, removeClueActive }) => {
    const [editMode, setEditMode] = useState(false);
    const [clueText, setClueText] = useState(clue.clue);
    // pass in a method for updating the clue and saving the game

    useKeypress(ENTER, () => {
        if(editMode) {
            handleBlur();
        }
    });

    const handleChange = event => setClueText(event.target.value);

    const handleBlur = () => {
        saveGameWithClue(clue.id, clueText);
        setEditMode(false);
        removeClueActive(clue.id);
    }

    const handleClickToEdit = () => {
        if(editMode) {
            saveGameWithClue(clue.id, clueText);
        } else {
            registerClueActive(clue.id);
        }
        setEditMode(!editMode)
    }

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
            <input autoFocus type="text" value={clueText} onChange={handleChange} onBlur={handleBlur}></input> :
            clue.clue }
        </span>
        <EditIcon
            className={editMode ? 'editIconSelected' : 'editIcon'}
            style={{ marginLeft: 'auto' }}
            onClick={handleClickToEdit} />
    </li>
}

export default Clue;
