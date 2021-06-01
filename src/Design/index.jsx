import React, {useRef, useState} from 'react';
import Clue, {EDIT_LINK} from './Clue'
import Crossword from "../Game/Crossword";
import EditablePageHeader from "./EditablePageHeader";

import RemoveCircleSharpIcon from '@material-ui/icons/RemoveCircleSharp';
import AddCircleSharpIcon from '@material-ui/icons/AddCircleSharp';
import Tooltip from '@material-ui/core/Tooltip';
import Grid from "@material-ui/core/Grid";
import {makeStyles} from "@material-ui/core/styles";
import Button from "@material-ui/core/Button";

import cloneDeep from "lodash/cloneDeep";
import pull from "lodash/pull";

import {emptyDesignBoard, emptyTile, initDesignBoard} from "../Game/initBoard";
import {CLUE_COLUMN_TITLE, HORIZONTAL, VERTICAL} from "../Game/constants";
import {saveGame} from "../SaveGame";
import loadFile from "../LoadGame";

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

const Design = ({ classesParent }) => {
    const [game, setGame] = useState(emptyDesignBoard);
    const clueRefs = useRef([]).current;

    const activeItem = useRef('');

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

    const toggleTileBlock = (event, tile, game) => {
        event.preventDefault();
        const gameC = cloneDeep(game);
        const t = gameC.board[tile.y][tile.x];
        gameC.isTile(tile) ? t.blank = 'yes' : delete t.blank; // change this to simply adding the .block property
        setGame(initDesignBoard(gameC));
    }

    const saveGameWithTitle = title => {
        const gameC = cloneDeep(game) // TODO do we need these clone deeps?
        gameC.title = title;
        activeItem.current = '';

        setGame(initDesignBoard(gameC))
    }

    const modifyBoardLength = (start, add) => {
        let method = (a, b) => console.log('Error in modifyBoardLength');
        const gameC = cloneDeep(game);
        let newRow;
        if(add) {
            const newArrayLength = game.board.length + 1
            newRow = new Array(newArrayLength);
            for (let i = 0; i < newArrayLength; i++) { // faster than .forEach or .fill().map(...)
                newRow[i] = emptyTile();
            }
            method = (array, value) => start ? array.unshift(value) : array.push(value)
        } else {
            method = array => start ? array.shift() : array.pop();
        }
        gameC.board.forEach(row => method(row, emptyTile()));
        method(gameC.board, newRow);
        setGame(initDesignBoard(gameC, start));
    }

    const registerActiveItem = editId => { activeItem.current = editId; setTimestamp(Date.now()) } // TODO rename to generic item active
    const unregisterActiveItem = () => {
        activeItem.current = '';
        setTimestamp(Date.now());
    }

    const endClueEdit = (clueId, clueText) => {
        const gameC = cloneDeep(game);
        gameC.getClue(clueId).clue = clueText;
        activeItem.current = '';
        setGame(initDesignBoard(gameC));
    }

    const handleClueClick = direction => clue => {
        if(activeItem.current && activeItem.current.includes(EDIT_LINK)) {
            if(activeItem.current.includes(clue.id)) {
                return;
            }

            const selectedClue = game.getClue(game.getClueIdFromTile());
            const indexOfClueAlreadyLinked = selectedClue.linkClues.findIndex(clueId => clueId === clue.id);
            if(indexOfClueAlreadyLinked >= 0) {
                pull(selectedClue.linkClues, clue.id);
            } else {
                selectedClue.linkClues.push(clue.id);
            }
            setTimestamp(Date.now());

        } else {
            activateTile(clue.tile, direction);
        }
    }

    const ModifyGameBoardLengthStart = () => {
        return (
            <div>
                <Tooltip title="Add Row & Column">
                    <AddCircleSharpIcon aria-label='Add Row & Column to top left of crossword' onClick={() => modifyBoardLength(true, true)} style={{ color: "green", cursor: 'pointer' }} />
                </Tooltip>
                <Tooltip title="Delete Row & Column">
                    <RemoveCircleSharpIcon onClick={() => modifyBoardLength(true, false)} style={{ color: "red", cursor: 'pointer' }} />
                </Tooltip>
            </div>
        )
    }

    const ModifyGameBoardLengthEnd = () => {
        return (
            <div style={{ display: "flex", alignItems: "flex-end" }}>
                <div onClick={() => modifyBoardLength(false, true)}>
                    <Tooltip title="Add Row & Column">
                        <AddCircleSharpIcon style={{ color: "green", cursor: 'pointer' }} />
                    </Tooltip>
                </div>
                <div onClick={() => modifyBoardLength(false, false)}>
                    <Tooltip title="Delete Row & Column">
                        <RemoveCircleSharpIcon style={{ color: "red", cursor: 'pointer' }} />
                    </Tooltip>
                </div>
            </div>
        )
    }

    const classes = useStyles();

    return (
        <div className={classes.root}>
            <EditablePageHeader
                title={game.title} classes={classesParent} saveGameWithTitle={saveGameWithTitle}
                registerActiveItem={registerActiveItem}>
                <Button
                    style={{ backgroundColor: '#85dcb0', margin: '0 20px 0 20px' }}
                    variant="contained"
                    onClick={() => saveGame(game)}
                    tabIndex="-1"
                >Save</Button>
                <Button
                    style={{ backgroundColor: '#41b3ac', margin: '0 0 0 20px', color: 'white' }}
                    variant="contained"
                    onClick={() => loadFile(setGame)}
                    tabIndex="-1"
                >Load</Button>
            </EditablePageHeader>
            <Grid container direction="row" justify="center" spacing={0}>
                <Grid item xs={12} sm={6} style={{ display: 'contents' }}>
                    <ModifyGameBoardLengthStart />
                    <Crossword game={game} rightClick={toggleTileBlock} activateTile={activateTile} preventCrosswordTyping={activeItem.current !== ''} />
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
                                    handleClueClick={handleClueClick(HORIZONTAL)}
                                    selected={clue.id === game.getClueIdFromTile()}
                                    secondary={clue.id === game.getSecondaryClueIdFromTile()}
                                    setRef={elem => clueRefs[clue.id] = elem}
                                    registerActiveItem={registerActiveItem}
                                    activeItem={activeItem.current}
                                    endClueEdit={endClueEdit}
                                    linked={game.getClue(game.getClueIdFromTile()).linkClues.find(clueId => clueId === clue.id)}
                                    endClueLink={unregisterActiveItem}
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
                                    handleClueClick={handleClueClick(VERTICAL)}
                                    selected={clue.id === game.getClueIdFromTile()}
                                    secondary={clue.id === game.getSecondaryClueIdFromTile()}
                                    setRef={elem => clueRefs[clue.id] = elem}
                                    registerActiveItem={registerActiveItem}
                                    activeItem={activeItem.current}
                                    endClueEdit={endClueEdit}
                                    linked={game.getClue(game.getClueIdFromTile()).linkClues.find(clueId => clueId === clue.id)}
                                    endClueLink={unregisterActiveItem}
                                />
                            })}
                        </ol>
                    </Grid>
                </Grid>
            </Grid>
        </div>
    )
}

export default Design;
