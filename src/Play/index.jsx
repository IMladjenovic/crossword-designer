import React, {useEffect, useState} from 'react';
import Crossword from "../Game/Crossword";
import PageHeader from "./PageHeader";
import Clue from "./Clue";

import Button from "@material-ui/core/Button";
import Grid from "@material-ui/core/Grid";

import {CLUE_COLUMN_TITLE, HORIZONTAL, VERTICAL} from "../Game/constants";
import {saveGame} from "../SaveGame";
import loadFile from "../LoadGame";
import {makeStyles} from "@material-ui/core/styles";
import { activateEndGameMessage } from './endGame';

const useStyles = makeStyles((theme) => ({
    root: { flexGrow: 1 },
    selectedClue: { backgroundColor: '#85dcb0' },
    snackbar: { backgroundColor: '#41b3ac' },
    block: { /*fill: #e27d60;*/ fill: '#e8a87c' },
    tile: { fill: 'none', stroke: 'none', pointerEvents: 'visible' },
    gameBoardBackground: { fill: '#fafafa', stroke: 'none' },
    // gameWon .gameBoardBackground, .gameWon .selected {
    gameWon: { fill: '#85dcb0', transition: 'fill 3s' },
    finishMessagePixel: { fill: '#c38d9e' },
    selected: { fill: '#c38d9e' },
    highlighted: { fill: '#85dcb0' },
    svg: { maxHeight: '600px '},
    clueNumber: { fontSize: '0.8em' },
    guess: { fontSize: '1.8em' },
    grid: { stroke: '#e27d60' },
    text: { cursor: 'default' }
}));

const Play = ({ classesParent, setPlayGame }) => {
    const [game, setGame] = useState(null);
    const [gameWon, setGameWon] = useState(false);
    const classes = useStyles();
    const [timestamp, setTimestamp] = useState(Date.now());

    useEffect(() => {
        if(!game) {
            loadFile(setGame).catch(() => setPlayGame(false))
        }
    }, []);

    const activateTile = (
        tile,
        direction
    ) => {
        game.selectedTile = tile;
        if(direction) {
            game.direction = direction;
        }
        setTimestamp(Date.now())
    }

    const postKeyPress = () => {
        let incorrectGuess = false;
        console.log("postKeyPress")
        for (let y = 0; y < game.board.length; y++) {
            for(let x = 0; x < game.board.length; x++) {
                const tile = game.getTileBoardItem({ x, y });
                if(!tile.blank) {
                    if(!tile.guess) {
                        return;
                    }
                    if(tile.guess !== tile.answer) {
                        incorrectGuess = true;
                    }
                }
            }
        }
        console.log("incorrectGuess", incorrectGuess)
        if(!incorrectGuess) {
            console.log("setGameWon true")
            setGameWon(true);
            activateEndGameMessage(game, setGameWon, setTimestamp);
        }
    }

    return game ? (
        <div className={classes.root}>
            <PageHeader title={game.title} classes={classesParent}>
                <Button
                    style={{ backgroundColor: '#85dcb0', margin: '0 20px 0 20px' }}
                    variant="contained"
                    onClick={() => saveGame(game)}
                    tabIndex="-1"
                >Save</Button>
                <Button
                    style={{ backgroundColor: '#41b3ac', margin: '0 0 0 20px', color: 'white' }}
                    variant="contained"
                    onClick={() => loadFile(setGame).catch(() => setPlayGame(false))}
                    tabIndex="-1"
                >Load</Button>
            </PageHeader>
            <Grid container direction="row" justify="center" spacing={0}>
                <Grid item xs={12} sm={6} style={{ display: 'contents' }} className={gameWon ? 'gameWon' : ''} >
                    <Crossword game={game}
                               activateTile={activateTile}
                               preventCrosswordTyping={gameWon}
                               postKeyPress={postKeyPress}
                               gameWon={gameWon}
                    />
                </Grid>
                <Grid container direction='row' item xs={12} sm={6}>
                    <Grid item xs={12} sm={6}>
                        <span style={{ fontSize: '1.5em', height: '40px', display: 'block' }}>{CLUE_COLUMN_TITLE[HORIZONTAL]}</span>
                        <ol style={{ height: `${game.gameBoardSize}px`, overflowY: 'scroll', margin: '0 10px 0 0', listStyle: 'none', paddingLeft: '10px' }}>
                            {game.clues[HORIZONTAL].map(clue => {
                                return <Clue
                                    key={clue.id}
                                    clue={clue}
                                    handleClueClick={() => activateTile(clue.tile, HORIZONTAL)}
                                    selected={clue.id === game.getClueIdFromTile()}
                                    secondary={clue.id === game.getSecondaryClueIdFromTile()}
                                    linked={game.getClue(game.getClueIdFromTile()).linkClues.find(clueId => clueId === clue.id)}
                                />
                            })}
                        </ol>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <span style={{ fontSize: '1.5em', height: '40px', display: 'block' }}>{CLUE_COLUMN_TITLE[VERTICAL]}</span>
                        <ol style={{ height: `${game.gameBoardSize}px`, overflowY: 'scroll', margin: '0 10px 0 0', listStyle: 'none', paddingLeft: '10px' }}>
                            {game.clues[VERTICAL].map(clue => {
                                return <Clue
                                    key={clue.id}
                                    clue={clue}
                                    handleClueClick={() => activateTile(clue.tile, VERTICAL)}
                                    selected={clue.id === game.getClueIdFromTile()}
                                    secondary={clue.id === game.getSecondaryClueIdFromTile()}
                                    linked={game.getClue(game.getClueIdFromTile()).linkClues.find(clueId => clueId === clue.id)}
                                />
                            })}
                        </ol>
                    </Grid>
                </Grid>
            </Grid>
        </div>
    ) : <div />
}

export default Play;
