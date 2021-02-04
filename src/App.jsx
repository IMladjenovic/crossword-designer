import './App.css';
import React from "react";
import GameBoard from "./gameBoard";
import Box from "@material-ui/core/Box";
import Typography from "@material-ui/core/Typography";
import Grid from "@material-ui/core/Grid";
import { makeStyles } from '@material-ui/core/styles';
import {Container} from "@material-ui/core";

const useStyles = makeStyles({
    root: {
        // background: 'linear-gradient(45deg, #186118 30%, #48c9b0 90%)',
        background: 'linear-gradient(155deg, #41b3ac 10%, #e8a87c 85%)',
        // background: '#186118',
        // borderBottom: "15px solid #228b22",
        // border: "15px",
        // borderStyle: "solid",
        // borderColor: '#228b22',
        // borderRadius: 3,
        // boxShadow: '0 3px 5px 2px rgba(255, 105, 135, .3)',
        color: 'white',
        // height: 48,
        padding: '10px 40px',
        margin: 0,
        alignContent: "center"
        // marginLeft: '30px',
    },
    borderGradient: {
        background: 'linear-gradient(45deg, #e8a87c 30%, #e8a87c 90%)',
        margin: 0,
        marginBottom: 32,
        padding: "5px"
    }
});

function App() {
    const classes = useStyles();
    return (
        <div className="App" >
            <Grid container spacing={0}>
                <Grid item xs={12} >
                    <Box my={4} className={classes.root}>
                        <Box className={classes.test1}>
                            <Typography variant="h4" component="div" >
                                Crossword Designer!
                            </Typography>
                        </Box>
                    </Box>
                    <Box my={4} className={classes.borderGradient}>
                    </Box>
                </Grid>
                <Grid item xs={12} >
                    <GameBoard />
                </Grid>
            </Grid>
        </div>
    );
}

export default App;
