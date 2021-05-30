import React, {useRef, useState} from 'react';
import RemoveCircleSharpIcon from '@material-ui/icons/RemoveCircleSharp';
import AddCircleSharpIcon from '@material-ui/icons/AddCircleSharp';

import cloneDeep from "lodash/cloneDeep";
import last from "lodash/last";
import first from "lodash/first";
import pull from "lodash/pull";

import {block, emptyDesignBoard, emptyTile, initDesignBoard} from "../Game/initBoard";
import {CLUE_COLUMN_TITLE, HORIZONTAL, VERTICAL} from "../Game/constants";
import Grid from "@material-ui/core/Grid";
import Crossword from "../Game/Crossword";
import {makeStyles} from "@material-ui/core/styles";
import Clue from './Clue'

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

const Design = () => {
    const [game, setGame] = useState(emptyDesignBoard);
    const clueRefs = useRef([]).current;
    const activeClues = useRef([]).current

    const [timestamp, setTimestamp] = useState(Date.now());

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

    const saveConfig = useRef({ save: () => console.log("Save error") }).current;

    const toggleTileBlock = (event, tile, game) => {
        event.preventDefault();
        const gameC = cloneDeep(game);
        gameC.board[tile.y][tile.x] = gameC.isTile(tile) ? block() : emptyTile();
        setGame(initDesignBoard(gameC));
    }

    const saveGameWithClue = (clueId, clueText) => {
        const gameC = cloneDeep(game);
        const direction = clueId.replace(/[0-9]/g, ''); // strip numbers from string
        console.log(gameC.clues[direction].find(clue => clue.id === clueId));
        gameC.clues[direction].find(clue => clue.id === clueId).clue = clueText;
        console.log(gameC.clues[direction].find(clue => clue.id === clueId));
        setGame(initDesignBoard(gameC));
    }

    const modifyBoardLength = (start, add) => {
        let method;
        if(add) {
            method = array => start ? array.unshift(first(array)) : array.push(last(array))
        } else {
            method = array => start ? array.shift() : array.pop();
        }
        const gameC = cloneDeep(game);
        gameC.board.forEach(row => method(row));
        method(gameC.board);
        setGame(initDesignBoard(gameC));
    }

    const registerClueActive = clueId => activeClues.push(clueId);
    const removeClueActive = clueId => pull(activeClues, clueId);

    const ModifyGameBoardLengthStart = () => {
        return (
            <div>
                <AddCircleSharpIcon onClick={() => modifyBoardLength(true, true)} style={{ color: "green", cursor: 'pointer' }} />
                <RemoveCircleSharpIcon onClick={() => modifyBoardLength(true, false)} style={{ color: "red", cursor: 'pointer' }} />
            </div>
        )
    }

    const ModifyGameBoardLengthEnd = () => {
        return (
            <div style={{ display: "flex", alignItems: "flex-end" }}>
                <div onClick={() => modifyBoardLength(false, true)}>
                    <AddCircleSharpIcon style={{ color: "green", cursor: 'pointer' }} />
                </div>
                <div onClick={() => modifyBoardLength(false, false)}>
                    <RemoveCircleSharpIcon style={{ color: "red", cursor: 'pointer' }} />
                </div>
            </div>
        )
    }

    const classes = useStyles();

    return (
        <div className={classes.root}>
            <Grid container direction="row" justify="center" spacing={0}>
                <Grid item xs={12} sm={6} style={{ display: 'contents' }}>
                    <ModifyGameBoardLengthStart />
                    <Crossword game={game} saveConfig={saveConfig} rightClick={toggleTileBlock} activateTile={activateTile}
                               preventCrosswordTyping={activeClues.length > 0} />
                    <ModifyGameBoardLengthEnd />
                </Grid>
                <Grid container direction='row' item xs={12} sm={6}>
                    <Grid item xs={12} sm={6}>
                        <span style={{ fontSize: '1.5em', height: '40px', display: 'block' }}>{CLUE_COLUMN_TITLE[HORIZONTAL]}</span>
                        <ol style={{ height: `${game.gameBoardSize}px`, overflowY: 'scroll', margin: '0 10px 0 0', listStyle: 'none', paddingLeft: '10px' }}>
                            {game.clues[HORIZONTAL].map(clue => {
                                return <Clue
                                    key={clue.id}
                                    clue={clue}
                                    handleClueClick={tile => activateTile(tile, HORIZONTAL)}
                                    selected={clue.id === game.getTileClue()}
                                    secondary={clue.id === game.getSecondaryTileClue()}
                                    setRef={elem => clueRefs[clue.id] = elem}
                                    saveGameWithClue={saveGameWithClue}
                                    registerClueActive={registerClueActive}
                                    removeClueActive={removeClueActive}
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
                                    handleClueClick={tile => activateTile(tile, VERTICAL)}
                                    selected={clue.id === game.getTileClue()}
                                    secondary={clue.id === game.getSecondaryTileClue()}
                                    setRef={elem => clueRefs[clue.id] = elem}
                                />
                            })}
                        </ol>
                    </Grid>
                </Grid>
            </Grid>
        </div>
    )
}

const GameBoard = ({ game, saveConfig, rightClick, child1, child2 }) => {

}

export default Design;
