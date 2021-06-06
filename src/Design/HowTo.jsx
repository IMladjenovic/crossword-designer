import React from 'react';
import Typography from "@material-ui/core/Typography";
import EditIcon from "@material-ui/icons/Edit";
import CompareArrowsRoundedIcon from '@material-ui/icons/CompareArrowsRounded';
import RemoveCircleSharpIcon from '@material-ui/icons/RemoveCircleSharp';
import AddCircleSharpIcon from '@material-ui/icons/AddCircleSharp';
import LoopIcon from '@material-ui/icons/Loop';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles((theme) => ({
    list: {
        listStyle: 'none',
        cursor: 'default',
        textAlign: 'center',
        padding: '0',
        '& li': {
            padding: '10px 0',
            fontSize: '1.2em',
        },
        '& svg': {
            verticalAlign: 'bottom'
        }
    },
    header: {
        textAlign: 'center'
    }
}));

const HowTo = () => {
    const classes = useStyles();
    return (
        <div style={{ color: 'white' }}>
            <Typography className={classes.header} variant="h4" component="div" >How to design a crossword</Typography>
            <ol className={classes.list} >
                <li>Right click to add block tiles to your crossword.</li>
                <li>Shift-right click to add circle tiles to your crossword.</li>
                <li>Use <EditIcon /> to edit the text of your clues and the title of your crossword.</li>
                <li>Use <CompareArrowsRoundedIcon /> to link one clue to another clue from the clue lists.</li>
                <li>Use <AddCircleSharpIcon /> and <RemoveCircleSharpIcon /> to change the size of your crossword.</li>
                <li>Use <LoopIcon /> to place blocks with rotational symmetry.</li>
                <li>Please save your game regularly. You can load these files to continue editing later.</li>
                <li>Click on publish when you are finished designing your crossword.</li>
                <li>This will let you add a message to appear when the game is completed.</li>
            </ol>
        </div>
    )
}

export default HowTo;