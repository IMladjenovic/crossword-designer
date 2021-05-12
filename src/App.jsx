import './App.css';
import React, {useState, useEffect} from "react";
import GameBoard from "./Game";
import Box from "@material-ui/core/Box";
import Typography from "@material-ui/core/Typography";
import Grid from "@material-ui/core/Grid";
import { makeStyles } from '@material-ui/core/styles';
import LoadGame from './LoadGame';
import cloneDeep from 'lodash/cloneDeep';
import { initBoard, tilePositionConfig } from "./Game/initBoard";

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
    const [loadedFileData, setLoadedFileData] = useState(null);
    const [crosswordData, setCrosswordData] = useState(null);

    useEffect(() => {
        if(loadedFileData === null) {
            return;
        }

        const data = cloneDeep(loadedFileData)
        data.tileSize = (window.screen.height - (350)) / data.crossword.board.length;
        if(data.init) {
            setCrosswordData(data);
        } else {
            console.log("data", data)
            data.init = initBoard(data);
            data.tilePositionConfig = tilePositionConfig(data);
            setCrosswordData(data);
        }
    }, [loadedFileData])

    const leaveGame = () => {
        setLoadedFileData(null);
        setCrosswordData(null);
    }

    return (
        <div className="App" >
            <Grid container spacing={0} style={{ minHeight: crosswordData === null ? '100vh' : '', marginBottom: '-20px' }} >
                <Grid item xs={12} >
                    <Box my={4} className={classes.root}>
                        <Box className={classes.test1}>
                            <Typography variant="h4" component="div" >
                                { crosswordData === null ? 'Play a Crossword' : crosswordData.title }
                            </Typography>
                        </Box>
                    </Box>
                    <Box my={4} className={classes.borderGradient}>
                    </Box>
                </Grid>
                <Grid item xs={12} >
                    {crosswordData ?
                        <GameBoard data={crosswordData} leaveGame={leaveGame} /> :
                        <LoadGame setLoadedFileData={setLoadedFileData} />
                    }
                </Grid>
            </Grid>
        </div>
    );
}

export default App;
