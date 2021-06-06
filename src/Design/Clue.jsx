import React, {useState, useRef} from "react";
import EditIcon from '@material-ui/icons/Edit';
import CompareArrowsRoundedIcon from '@material-ui/icons/CompareArrowsRounded';
import Tooltip from '@material-ui/core/Tooltip';

import './Clue.css'
import useKeypress from "react-use-keypress";
import { ENTER } from "../Game/constants";

export const EDIT_TEXT = '-EDIT-TEXT';
export const EDIT_LINK = '-EDIT-LINK';

const prep = (clue, activeItem) => {
    const editText = `${clue.id}${EDIT_TEXT}`;
    const editLink = `${clue.id}${EDIT_LINK}`;
    const editMode = activeItem === editText;
    const linkMode = activeItem === editLink;
    return { editText, editLink, editMode, linkMode };
};

const Clue = ({
    clue,
    handleClueClick,
    selected,
    secondary,
    linked,
    setRef,
    registerActiveItem,
    activeItem,
    endClueEdit,
    endClueLink,
    activateTile
}) => {
    const [clueText, setClueText] = useState(clue.clue);
    const lastBlurTime = useRef(Date.now());
    const { editText, editLink, editMode, linkMode } = prep(clue, activeItem);

    useKeypress(ENTER, () => {
        if(editMode) {
            handleBlur();
        }
    });

    const handleChange = event => setClueText(event.target.value);

    const handleBlur = () => {
        endClueEdit(clue.id, clueText);
        lastBlurTime.current = Date.now();
    }

    const handleClickToLink = event => {
        event.stopPropagation();
        if(!linkMode && lastBlurTime.current + 500 < Date.now()) {
            activateTile(clue.tile);
            registerActiveItem(editLink);
        } else {
            endClueLink();
        }
    }

    const handleClickToEditText = () => {
        if(!editMode && lastBlurTime.current + 500 < Date.now()) {
            registerActiveItem(editText);
        }
    }

    return <li
    style={{
        ...(selected ? { backgroundColor: '#85dcb0' } :
            linked ? { backgroundColor: '#e8a87c', opacity: '60%' } : {}),
        cursor: 'pointer',
        outline: 'none',
        display: 'flex',
        padding: '5px 10px 5px 1px'
    }}
    className={`${secondary ? 'secondaryClueBorder' : 'clueBorder'} ${activeItem.includes(EDIT_LINK) && activeItem !== editLink ? 'highlightLinkOnHover' : ''}`}
    key={clue.id}
    id={clue.id}
    selected={selected}
    onClick={() => handleClueClick(clue)}
    ref={setRef}
    tabIndex='-1'>
        <span style={{ fontWeight: 'bold',
            textAlign: 'right',
            minWidth: '12px',
            width: '12px'
        }}>{clue.clueNumber}</span>
        <span style={{
            marginLeft: '10px'
        }}>{ editMode ?
            <input autoFocus type="text" value={clueText} onChange={handleChange} onBlur={handleBlur} /> :
            clue.clue }
        </span>
        <EditIcon
            className={editMode ? 'editIconSelected' : 'editIcon'}
            onClick={handleClickToEditText} />
        {(!activeItem.includes(EDIT_LINK) || activeItem === editLink) && <Tooltip title={"Link related clues"}>
            <CompareArrowsRoundedIcon
                className={linkMode ? 'editIconSelected' : 'editIcon'}
                style={{ marginLeft: 'auto' }}
                onClick={handleClickToLink} />
        </Tooltip>}
    </li>
}

export default Clue;
