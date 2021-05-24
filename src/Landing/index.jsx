import React from "react";
import Grid from "@material-ui/core/Grid";
import Button from "@material-ui/core/Button";

import loadFile from "../LoadGame";

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

const Landing = ({ setGameData, setDesignGame }) => {
    return (
        <Grid container spacing={0} justify="center" direction="column"
              alignItems="center">
            <Grid container item xs={12} justify="center" >
                <Button
                    style={{ backgroundColor: '#85dcb0' }}
                    variant="contained"
                    onClick={() => loadFile(setGameData)}
                >Play</Button>
                <Button
                    style={{ backgroundColor: '#85dcb0' }}
                    variant="contained"
                    onClick={() => setDesignGame(true)}
                >Design</Button>
            </Grid>
        </Grid>
    )
}

export default Landing;
