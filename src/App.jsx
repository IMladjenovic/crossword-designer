import './App.css';
import React, {useState, useEffect, useRef} from "react";
import GameBoard from "./Game";
import Box from "@material-ui/core/Box";
import Typography from "@material-ui/core/Typography";
import Grid from "@material-ui/core/Grid";
import { makeStyles } from '@material-ui/core/styles';
import Landing from './Landing';
import Design from "./Design";
import Play from "./Play";

const useStyles = makeStyles({
    root: {
        background: 'linear-gradient(155deg, #41b3ac 10%, #e8a87c 85%)',
        color: 'white',
        padding: '10px 40px',
        margin: 0,
        alignContent: "center"
    },
    borderGradient: {
        background: 'linear-gradient(45deg, #e8a87c 30%, #e8a87c 90%)',
        margin: 0,
        marginBottom: 10,
        padding: "5px"
    }
});

function App() {
    const classes = useStyles();

    const [gameData, setGameData] = useState(null);

    const [designGame, setDesignGame] = useState(false);
    const [playGame, setPlayGame] = useState(false);

    return (
        <div className="App" >
            <Grid container spacing={0} style={{ minHeight: gameData === null ? '100vh' : '', marginBottom: '-20px' }} >
                <Grid item xs={12} >
                    <Box my={4} className={classes.root}>
                        <Box className={classes.test1}>
                            <Grid container item justify="space-between" spacing={0}>
                                <Grid item>
                                    <Typography variant="h4" component="div" >
                                        { 'Play a Crossword' }
                                    </Typography>
                                </Grid>
                            </Grid>
                        </Box>
                    </Box>
                    <Box my={4} className={classes.borderGradient}>
                    </Box>
                </Grid>
                <Grid item xs={12} >
                    {playGame ?
                        <Play /> :
                     designGame ?
                        <Design /> :
                        <Landing setPlayGame={setPlayGame} setDesignGame={setDesignGame} />
                    }
                </Grid>
            </Grid>
        </div>
    );
}

export default App;
