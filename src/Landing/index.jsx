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

const Landing = ({ setPlayGame, setDesignGame }) => {
    return (
        <Grid container spacing={0} justify="center" direction="column"
              alignItems="center">
            <Grid container item xs={12} justify="center" >
                <Button
                    style={{ backgroundColor: '#85dcb0' }}
                    variant="contained"
                    onClick={() => setPlayGame(true)}
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
