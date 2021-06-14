import React, {useRef, useState} from "react";
import useKeypress from "react-use-keypress";

import {ENTER} from "../Crossword/constants";

import Grid from "@material-ui/core/Grid";
import EditIcon from "@material-ui/icons/Edit";
import Box from "@material-ui/core/Box";
import Typography from "@material-ui/core/Typography";

const TITLE_ID = 'TITLE_EDIT'

export const PageHeader = ({ title, children, classes, saveGameWithTitle, registerActiveItem }) => {
    const [editMode, setEditMode] = useState(false);
    const [titleText, setTitleText] = useState(title);
    const lastBlurTime = useRef(Date.now());

    useKeypress(ENTER, () => {
        if(editMode) {
            handleBlur();
        }
    });

    const handleChange = event => setTitleText(event.target.value);

    const handleBlur = () => {
        saveGameWithTitle(titleText);
        setEditMode(false);
        lastBlurTime.current = Date.now();
    }

    const handleClickToEdit = () => {
        if(!editMode && lastBlurTime.current + 500 < Date.now()) {
            setEditMode(true);
            registerActiveItem(TITLE_ID);
        }
    }

    return (
        <Grid item xs={12} >
            <Box my={4} className={classes.root}>
                <Box className={classes.test1}>
                    <Grid container item justify="space-between" spacing={0}>
                        <Grid item>
                            <Typography variant="h4" component="div" >{editMode ?
                                <input autoFocus type="text" value={titleText} onChange={handleChange} onBlur={handleBlur} /> :
                                <span onClick={handleClickToEdit} style ={{ cursor: 'pointer' }}>{title}</span>}
                                <EditIcon
                                className={editMode ? 'editIconSelected' : 'editIcon'}
                                style={{ marginLeft: '10px', cursor: 'pointer' }}
                                onClick={handleClickToEdit} />
                            </Typography>
                        </Grid>
                        <Grid item>
                            {children}
                        </Grid>
                    </Grid>
                </Box>
            </Box>
            <Box my={4} className={classes.borderGradient}>
            </Box>
        </Grid>
    )
}

export default PageHeader;