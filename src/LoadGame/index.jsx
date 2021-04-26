import React from "react";
import Grid from "@material-ui/core/Grid";
import Button from "@material-ui/core/Button";

export const pickerOpts = {
    types: [
        {
            description: 'Crossword Game (.json)',
            accept: {
                '-crossword/*': ['.json']
            }
        },
    ],
    excludeAcceptAllOption: true,
    multiple: false
};

const LoadGame = ({ setLoadedFileData }) => {

    const loadFile = async () => {
        let fileHandle;
        // open file picker, destructure the one element returned array
        [fileHandle] = await window.showOpenFilePicker(pickerOpts);
        const fileData = await fileHandle.getFile();
        const jsonFile = await fileData.text();
        const crosswordData = JSON.parse(jsonFile);
        setLoadedFileData(crosswordData);
    }

    return (
        <Grid container spacing={0} justify="center" direction="column"
              alignItems="center">
            <Grid container item xs={12} justify="center" >
                <Button
                    style={{ backgroundColor: '#85dcb0' }}
                    variant="contained"
                    onClick={() => loadFile()}
                >Play</Button>
            </Grid>
        </Grid>
    )
}

export default LoadGame;