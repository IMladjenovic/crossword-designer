import React, {useRef, useState} from 'react';
import Clue, {EDIT_LINK} from './Clue'
import Crossword from "../Game/Crossword";
import EditablePageHeader from "./EditablePageHeader";
import HowTo from "./HowTo";

import RemoveCircleSharpIcon from '@material-ui/icons/RemoveCircleSharp';
import AddCircleSharpIcon from '@material-ui/icons/AddCircleSharp';
import Tooltip from '@material-ui/core/Tooltip';
import Grid from "@material-ui/core/Grid";
import {makeStyles} from "@material-ui/core/styles";
import Button from "@material-ui/core/Button";
import Backdrop from '@material-ui/core/Backdrop';
import LoopIcon from '@material-ui/icons/Loop';
import MuiAlert from '@material-ui/lab/Alert';

import cloneDeep from "lodash/cloneDeep";
import pull from "lodash/pull";

import {
    ADD_TO_END,
    ADD_TO_START,
    DELETE_END,
    DELETE_START,
    emptyDesignBoard,
    initDesignBoard
} from "../Game/initBoard";
import {CLUE_COLUMN_TITLE, HORIZONTAL, VERTICAL} from "../Game/constants";
import {saveGame} from "../SaveGame";
import loadFile from "../LoadGame";
import {publish, verifyPublish} from "./publishGame";
import Snackbar from "@material-ui/core/Snackbar";
import EditableGameCompleteMessage from "./EditableGameCompleteMessage";
import {activateEndGameMessage} from "../Play/endGame";

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

const invertTile = (index, boardLength) => (index - boardLength + 1) * -1;
const getRotatedTile = (tile, boardLength) => ({ x: invertTile(tile.x, boardLength), y: invertTile(tile.y, boardLength) });

const Alert = props => <MuiAlert elevation={6} variant="filled" {...props} />;

const Design = ({ classesParent }) => {
    const [game, setGame] = useState(emptyDesignBoard);
    const [publishErrorMessage, setPublishErrorMessage] = useState('');
    const [howTo, setHowTo] = useState(false);
    const [rotationalSymmetry, setRotationalSymmetry] = useState(false);
    const clueRefs = useRef([]).current;
    const [demoGame, setDemoGame] = useState(false);

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
        const t = game.getTileBoardItem(tile);
        if(event.shiftKey) {
            t.circle = 'yes';
        } else {
            const isTile = game.isTile(tile);
            isTile ? t.blank = 'yes' : delete t.blank;
            if(rotationalSymmetry) {
                const oppositeTile = game.getTileBoardItem(getRotatedTile(tile, game.board.length));
                isTile ? oppositeTile.blank = 'yes' : delete oppositeTile.blank
            }
        }
        setGame(initDesignBoard(game));
    }

    const saveGameWithTitle = title => {
        const gameC = cloneDeep(game) // TODO do we need these clone deeps?
        gameC.title = title;
        activeItem.current = '';

        setGame(initDesignBoard(gameC))
    }

    const saveGameWithFinishMessage = message => {
        const gameC = cloneDeep(game) // TODO do we need these clone deeps?
        gameC.gameFinishedMessage = message;
        activeItem.current = '';

        setGame(initDesignBoard(gameC))
    }

    const modifyBoardLength = modificationType => {
        const gameC = cloneDeep(game)
        setGame(initDesignBoard(gameC, modificationType));
    }

    const registerActiveItem = editId => { activeItem.current = editId; setTimestamp(Date.now()) } // TODO rename to generic item active
    const unregisterActiveItem = () => registerActiveItem('')

    const endClueEdit = (clueId, clueText) => {
        game.getClue(clueId).clue = clueText;
        activeItem.current = '';
        setGame(initDesignBoard(game));
    }

    const preTileClick = () => activeItem.current = ''; // TODO consider changing this to a more user friendly experience

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

    const demoEndGameMessage = () => {
        setDemoGame(true);
        activateEndGameMessage(game, setDemoGame, setTimestamp);
    }

    const ModifyGameBoardLengthStart = () => {
        return (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
                <Tooltip title="Add Row & Column">
                    <AddCircleSharpIcon onClick={() => modifyBoardLength(ADD_TO_START)} style={{ color: "green", cursor: 'pointer' }} />
                </Tooltip>
                <Tooltip title="Delete Row & Column">
                    <RemoveCircleSharpIcon onClick={() => modifyBoardLength(DELETE_START)} style={{ color: "red", cursor: 'pointer' }} />
                </Tooltip>
                <Tooltip title="Rotational Symmetry">
                    <LoopIcon onClick={() => setRotationalSymmetry(!rotationalSymmetry)} style={{ margin: 'auto', cursor: 'pointer' }}
                        className={`editIcon ${rotationalSymmetry ? 'editIconSelected' : ''}`}
                    />
                </Tooltip>
                <div style={{ height: '48px' } }/>
            </div>
        )
    }

    const ModifyGameBoardLengthEnd = () => {
        return (
            <div style={{ display: "flex", alignItems: "flex-end", marginBottom: '-50px' }}>
                <div style={{ display: "flex", flexDirection: "column" }}>
                    <div onClick={() => modifyBoardLength(ADD_TO_END)}>
                        <Tooltip title="Add Row & Column">
                            <AddCircleSharpIcon style={{ color: "green", cursor: 'pointer' }} />
                        </Tooltip>
                    </div>
                    <div onClick={() => modifyBoardLength(DELETE_END)}>
                        <Tooltip title="Delete Row & Column">
                            <RemoveCircleSharpIcon style={{ color: "red", cursor: 'pointer' }} />
                        </Tooltip>
                    </div>
                </div>
            </div>
        )
    }

    const classes = useStyles();

    return (
        <div className={classes.root}>
            <Backdrop open={howTo} style={{ zIndex: '2', backgroundColor: 'rgba(0, 0, 0, 0.8)' }} onClick={() => setHowTo(false)}>
                <HowTo color="inherit" />
            </Backdrop>
            <Snackbar
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                open={publishErrorMessage !== ''}
                autoHideDuration={30 * 1000}
                onClose={() => setPublishErrorMessage('')}>
                    <Alert onClose={() => setPublishErrorMessage('')} severity="error">
                        {publishErrorMessage}
                    </Alert>
            </Snackbar>
            <EditablePageHeader
                title={game.title} classes={classesParent} saveGameWithTitle={saveGameWithTitle}
                registerActiveItem={registerActiveItem}>
                <Button
                    style={{ backgroundColor: '#85dcb0', margin: '0 20px 0 20px' }}
                    variant="contained"
                    onClick={() => setHowTo(true)}
                    tabIndex="-1"
                >How to</Button>
                <Button
                    style={{ backgroundColor: '#85dcb0', margin: '0 20px 0 20px' }}
                    variant="contained"
                    onClick={() => saveGame(game)}
                    tabIndex="-1"
                >Save</Button>
                <Button
                    style={{ backgroundColor: '#85dcb0', margin: '0 20px 0 20px' }}
                    variant="contained"
                    onClick={() => {
                        const v = verifyPublish(game);
                        if(v !== '') {
                            setPublishErrorMessage(v);
                            return;
                        }
                        saveGame(publish(game));
                    }}
                    tabIndex="-1"
                >Publish</Button>
                <Button
                    style={{ backgroundColor: '#41b3ac', margin: '0 0 0 20px', color: 'white' }}
                    variant="contained"
                    onClick={() => loadFile(setGame)}
                    tabIndex="-1"
                >Load</Button>
            </EditablePageHeader>
            <Grid container direction="row" justify="center" spacing={0}>
                <Grid container item direction="row" justify="center" spacing={0} xs={12} sm={6} style={{ margin: 'auto' }}>
                    <ModifyGameBoardLengthStart />
                    <div style={{ flexGrow: 1, maxWidth: `${game.gameBoardSize}px` }}>
                        <EditableGameCompleteMessage
                            message={game.gameFinishedMessage} classes={classesParent} saveGameWithFinishMessage={saveGameWithFinishMessage}
                            registerActiveItem={registerActiveItem} demoEndGameMessage={demoEndGameMessage} />
                        <Crossword game={game}
                                   gameWon={demoGame}
                                   rightClick={toggleTileBlock}
                                   activateTile={activateTile}
                                   preventCrosswordTyping={activeItem.current !== '' || demoGame}
                                   preTileClick={preTileClick}
                        />
                    </div>
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
                                    activateTile={tile => activateTile(tile, HORIZONTAL)}
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
                                    activateTile={tile => activateTile(tile, VERTICAL)}
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
