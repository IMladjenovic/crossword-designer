import React, {useEffect, useRef, useState} from "react";
import useKeypress from "react-use-keypress";

import {ENTER} from "../Crossword/constants";

import EditIcon from "@material-ui/icons/Edit";
import PlayCircleOutlineIcon from '@material-ui/icons/PlayCircleOutline';
import Tooltip from "@material-ui/core/Tooltip";

const GAME_FINISH_MESSAGE_ID = 'GAME_FINISH_MESSAGE_ID';

const EditableGameCompleteMessage = ({ message, saveGameWithFinishMessage, registerActiveItem, demoEndGameMessage }) => {
    const [messageText, setMessage] = useState(message);
    const [editMode, setEditMode] = useState(false);
    const lastBlurTime = useRef(Date.now());

    useKeypress(ENTER, () => {
        if(editMode) {
            handleBlur();
        }
    });

    useEffect(() => { setMessage(message) }, [message]);

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
            <span style={{ marginRight: '20px' }}>Game completed message:</span>
            {editMode ?
                <input autoFocus type="text" value={messageText} onChange={handleChange} onBlur={handleBlur}/> :
                <span onClick={handleClickToEdit} style={{cursor: 'pointer'}}>{messageText}</span>
            }
            <EditIcon
                className={editMode ? 'editIconSelected' : 'editIcon'}
                style={{ marginLeft: '10px', cursor: 'pointer' }}
                onClick={handleClickToEdit} />
            <Tooltip title={"Demo message"}>
                <PlayCircleOutlineIcon
                    className={editMode ? 'editIconSelected' : 'editIcon'}
                    style={{ marginLeft: '10px', cursor: 'pointer' }}
                    onClick={demoEndGameMessage} />
            </Tooltip>
        </div>
    )
}

export default EditableGameCompleteMessage;
