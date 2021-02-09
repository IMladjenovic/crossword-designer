import React from "react";
import Grid from "@material-ui/core/Grid";
import Button from "@material-ui/core/Button";

const LoadGame = ({ setCrosswordData }) => {
    const pickerOpts = {
        types: [
            {
                description: 'Crossword Game File',
                accept: {
                    '-crossword/*': ['.json']
                }
            },
        ],
        excludeAcceptAllOption: true,
        multiple: false
    };

    const loadFile = async () => {
        let fileHandle;
        // open file picker, destructure the one element returned array
        [fileHandle] = await window.showOpenFilePicker(pickerOpts);
        const fileData = await fileHandle.getFile();
        const jsonFile = await fileData.text();
        const crosswordData = JSON.parse(jsonFile);
        console.log(crosswordData);
        setCrosswordData(crosswordData);
    }

    return (
        <Grid container spacing={0} justify="center" direction="column"
              alignItems="center">
            <Grid container item xs={12} justify="center" >
                <Button
                    style={{ backgroundColor: '#85dcb0' }}
                    variant="contained"
                    onClick={() => loadFile()}
                >Load Game</Button>
            </Grid>
        </Grid>
    )
}

export default LoadGame;