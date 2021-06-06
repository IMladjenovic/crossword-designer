import React, {useRef, useState} from "react";
import EditIcon from "@material-ui/icons/Edit";
import useKeypress from "react-use-keypress";
import {ENTER} from "../Game/constants";

const GAME_FINISH_MESSAGE_ID = 'GAME_FINISH_MESSAGE_ID';

const EditableGameCompleteMessage = ({ message, saveGameWithFinishMessage, registerActiveItem }) => {
    const [messageText, setMessage] = useState(message);
    const [editMode, setEditMode] = useState(false);
    const lastBlurTime = useRef(Date.now());

    useKeypress(ENTER, () => {
        if(editMode) {
            handleBlur();
        }
    });

    const handleChange = event => setMessage(event.target.value);

    const handleBlur = () => {
        saveGameWithFinishMessage(messageText);
        setEditMode(false);
        lastBlurTime.current = Date.now();
    }

    const handleClickToEdit = () => {
        if(!editMode && lastBlurTime.current + 500 < Date.now()) {
            setEditMode(true);
            registerActiveItem(GAME_FINISH_MESSAGE_ID);
        }
    }

    return (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
            <span style={{ marginRight: '20px' }}>End game message:</span>
            {editMode ?
                <input autoFocus type="text" value={messageText} onChange={handleChange} onBlur={handleBlur}/> :
                <span onClick={handleClickToEdit} style={{cursor: 'pointer'}}>{messageText}</span>
            }
            <EditIcon
                className={editMode ? 'editIconSelected' : 'editIcon'}
                style={{ marginLeft: '10px', cursor: 'pointer' }}
                onClick={handleClickToEdit} />
        </div>
    )
}

export default EditableGameCompleteMessage;
