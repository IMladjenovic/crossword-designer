import React, { useState, useEffect, useRef, useCallback, memo } from 'react'
import useKeypress from 'react-use-keypress'

import './index.css';
import Grid from '@material-ui/core/Grid';
import { areEqual } from 'react-window';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import Snackbar from '@material-ui/core/Snackbar';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';
import { makeStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import memoize from 'memoize-one';
import { getOppositeDirection } from "./utils";
import { arrowKeyPress, clearLetterKey, letterKeyPres } from "./handleInput";

import cloneDeep from 'lodash/cloneDeep';
import throttle from 'lodash/throttle';
import debounce from 'lodash/debounce';

import { fonts, renderPixels } from 'js-pixel-fonts';

import {
    ALPHABET,
    ALPHABET_LOWER,
    DEFAULT_DIRECTION,
    HORIZONTAL,
    VERTICAL,
    ALL_DIRECTIONAL_KEYS,
    HORIZONTAL_ARROW_KEYS,
    VERTICAL_ARROW_KEYS,
    CLEAR_LETTER_KEYS,
    CLUE_COLUMN_TITLE
} from './constants'
import { pickerOpts } from "../LoadGame";

const RENDER_DEBOUNCE_LENGTH = 200;
const RENDER_DEBOUNCE_OPTIONS = { leading: false, trailing: true };

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

const grid = (nTiles, tileSize) => {
    let grid = '';
    const lineLength = (nTiles * tileSize) + 0.5;
    for(let i = 0; i < nTiles + 1; i++) {
        const lineStart = (i * tileSize);
        grid = `${grid} M0.00,${lineStart} l${lineLength},0.00 M${lineStart},0.00 l0.00,${lineLength} `;
    }
    return grid;
}

const Clue = ({ clue, handleClueClick, selected, secondary }) => {
    return <div
        style={{
            ...(selected ? { backgroundColor: '#85dcb0' } :
                secondary ? { backgroundColor: '#85dcb0', opacity: '50%' } : {}),
            cursor: 'pointer'
        }}
        key={clue.id}
        id={clue.id}
        button // TODO is this needed?
        selected={selected}
        onClick={() => handleClueClick(clue.tile, clue.id)}>
        <div style={{ fontWeight: 'bold', marginLeft: '3px' }}>{clue.clueNumber}</div><div>{ clue.clue }</div>
    </div>
}

const Cell = ({
              tileContent,
              x: _x,
              y: _y,
              className,
              onClick,
              finishMessagePixel,
              tileSize,
              clueNumberXOffset,
              clueNumberYOffset,
              clueNumberFontSize,
              guessXOffsetFunc,
              guessYOffset,
              guessFontSize,
              ...other
            }) => {
    const x = _x * tileSize;
    const y = _y * tileSize;
    return (
        <g>
            <rect
                x={x}
                y={y}
                height={tileSize}
                width={tileSize}
                className={finishMessagePixel ? "finishMessagePixel" : className}
                onClick={onClick}
                {...other}
            />
            <text x={x + clueNumberXOffset} y={y + clueNumberYOffset} style={{ fontSize: clueNumberFontSize }}  className='clueNumber' onClick={onClick}>{tileContent.clueNumber || ''}</text>
            <text x={x + guessXOffsetFunc(tileContent.guess)} y={y + guessYOffset} style={{ fontSize: guessFontSize }} className='guess' onClick={onClick}>{tileContent.guess}</text>
        </g>
    )
}

const Tile = ({ selected, highlighted, ...other }) => {
    return (
        <Cell className={`tile ${selected ? 'selected' : highlighted ? 'highlighted' : ''}`} {...other} />
    )
}

const Block = (props) => {
    return (
        <Cell className={`block`} {...props} />
    )
}

const GameBoard = ({ data, leaveGame }) => {
    const game = useRef({
        clues: {
            HORIZONTAL: [],
            VERTICAL: []
        },
        ...data.init,
        selectedClue: null,
        secondaryClue: null,
        selectedTile: data.init.clues[DEFAULT_DIRECTION][0].tile,
        highlightedTiles: data.init.clues[DEFAULT_DIRECTION][0].highlights,
        direction: DEFAULT_DIRECTION,
        previousKeyWasDelete: false,
        getTileClue: () => getTileBoardItem(game.selectedTile).clueNumberLink[game.direction],
        getSecondaryTileClue: () => getTileBoardItem(game.selectedTile).clueNumberLink[getOppositeDirection(game.direction)]
    }).current;
    const TILE_SIZE = useRef(data.tileSize).current;
    const tilePositionConfig = useRef(data.tilePositionConfig)

    const gameBoardSize = useRef(data.init.board.length * data.tileSize).current;
    const themeClues = useRef({ HORIZONTAL: {}, VERTICAL: {}, tiles: [] });
    const [timestamp, setTimestamp] = useState(Date.now());
    const horizontalList = useRef();
    const verticalList = useRef();
    const [gameWon, setGameWon] = useState(false);
    const [incorrectGuessNumberOpen, setIncorrectGuessNumberOpen] = useState(false);
    const throttledIncorrectGuessNumberOpen = useRef(throttle(() => setIncorrectGuessNumberOpen(true), 15000, { leading: true, trailing: false })).current;
    const incorrectGuesses = useRef(0);

    // finished game config
    const preventKeyPress = useRef(false);

    const getTileBoardItem = ({x , y}) => game.board[y][x];

    const handleClueClick = (clueTile, id, d) => {
        game.direction = d;
        activateTile(clueTile, d)
    };

    const handleCloseIncorrectGuessNumber = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }

        setIncorrectGuessNumberOpen(false);
        setTimeout(() => incorrectGuesses.current = 0, 3000);
    };

    const loadGlyphs = () => {
        data.customGlyphs.forEach(glyph => {
            const key = Object.keys(glyph)[0];
            fonts.sevenPlus.glyphs[key] = glyph[key];
        })
    }

    useEffect(() => {
        loadGlyphs();
    }, []);

    const classes = useStyles();

    useKeypress([
        ...VERTICAL_ARROW_KEYS,
        ...HORIZONTAL_ARROW_KEYS,
        ...ALPHABET,
        ...ALPHABET_LOWER,
        ...CLEAR_LETTER_KEYS
    ], ({ key }) => {
        if(preventKeyPress.current || gameWon) {
            return;
        }
        console.log("useKeypress", Date.now())
        // preventKeyPress.current = true;
        // setTimeout(() => preventKeyPress.current = false, 10);
        if([...ALL_DIRECTIONAL_KEYS].includes(key)) {
            arrowKeyPress(key, game, activateTile);
            game.previousKeyWasDelete = false;
            console.log("useKeypress End", Date.now())
            return;
        }
        if(key.length === 1 && key.match(/[a-z]/i)) {
            letterKeyPres(key, game, activateTile, setTimestamp, checkBoardAnswersCorrect);
            game.previousKeyWasDelete = false;
            console.log("useKeypress End", Date.now())
            return;
        }
        if(CLEAR_LETTER_KEYS.includes(key)) {
            clearLetterKey(key, game, activateTile, setTimestamp);
        }
    });

    const checkBoardAnswersCorrect = () => {
        if(gameWon) {
            return;
        }

        let countIncorrectGuesses = 0;
        game.board.forEach((row, y) => row.forEach((tile, x) => {
            if (!data.gameBoard[y][x].blank && tile.guess !== data.gameBoard[y][x].answer.toUpperCase()) {
                countIncorrectGuesses++;
            }
        }))
        if(countIncorrectGuesses !== 0) {
            incorrectGuesses.current = countIncorrectGuesses;
            throttledIncorrectGuessNumberOpen();
            return;
        }

        setGameWon(true);

        const tileBoardSnapshot = cloneDeep(game.board);
        const messageBoard = cloneDeep(game.board);
        const messageBoardSnapshots = []

        // config
        const startDelay = 3000;
        const messageSpeed = 175;
        const finishMessagePixels = renderPixels(data.gameFinishedMessage, fonts.sevenPlus);

        const pixelHeight = finishMessagePixels.length;
        const boardWidth = messageBoard[0].length;
        const numberOfPixelRenders = finishMessagePixels[0].length;
        if(boardWidth >= 7) {
            const yStart = (boardWidth - pixelHeight) / 2;
            for(let i = 0; i < numberOfPixelRenders; i++) {
                for(let y = 0; y < pixelHeight; y++) {
                    for(let x = 0; x < boardWidth; x ++) {
                        if(x === boardWidth - 1) {
                            messageBoard[y + yStart][x].finishMessagePixel = finishMessagePixels[y].shift();
                        } else {
                            messageBoard[y + yStart][x].finishMessagePixel = messageBoard[y + yStart][x + 1].finishMessagePixel;
                        }
                    }
                }
                messageBoardSnapshots.push(cloneDeep(messageBoard));
            }
            messageBoardSnapshots.forEach((snapshotOfBoard, i) => setTimeout(() => { game.board = snapshotOfBoard; setTimestamp(Date.now()) }, startDelay + (messageSpeed * i)));
            const gameTimeEnd = startDelay + (messageBoardSnapshots.length * messageSpeed);
            setTimeout(() => {
                setGameWon(false);
                game.board = tileBoardSnapshot;
                setTimestamp(Date.now())
                preventKeyPress.current = false;
            }, gameTimeEnd + startDelay);
        }
    }

    const saveGame = async () => {
        data.gameBoard = game.board;
        const jsonSave = JSON.stringify(data);

        // create a new handle
        const newHandle = await window.showSaveFilePicker(pickerOpts);

        // create a FileSystemWritableFileStream to write to
        const writableStream = await newHandle.createWritable();

        // write our file
        const blob = new Blob([jsonSave], {type : 'application/json'});
        await writableStream.write(blob);

        // close the file and write the contents to disk.
        await writableStream.close();
    }

    const getTileHighlights = (tile, d) =>
        game.clues[d].find(clue => clue.id === game.getTileClue(tile, d)).highlights;

    const activateTile = (
        tile,
        direction
    ) => {
        game.selectedTile = tile;

        if(direction) {
            let highlightTiles = [];
            if(themeClues.current[direction][game.getTileClue(tile, direction)]) {
                highlightTiles.push(...themeClues.current.tiles);
            }
            highlightTiles.push(...getTileHighlights(tile, direction));
            game.highlightedTiles = highlightTiles;

            const primaryClueId = game.getTileClue(tile, direction);
            const primaryClueIndex = game.clues[direction].findIndex(c => c.id === primaryClueId);
            if(primaryClueIndex >= 0) {
                // focusClueDebounce(primaryClueIndex, direction, getRefForListByDirection(direction))
            }

            const oppositeDirection = getOppositeDirection(direction);
            const secondaryClueId = game.getTileClue(tile, oppositeDirection);
            const secondaryClueIndex = game.clues[oppositeDirection].findIndex(c => c.id === secondaryClueId);
            if(secondaryClueIndex >= 0) {
                // focusSecondaryClueDebounce(secondaryClueIndex, oppositeDirection, getRefForListByDirection(oppositeDirection));
            }
        }
        setTimestamp(Date.now())
    }

    const getRefForListByDirection = direction => direction === HORIZONTAL ? horizontalList.current : verticalList.current

    const numberOfIncorrectGuessesText = () => {
        if(incorrectGuesses.current > 1) {
            return `You have ${incorrectGuesses.current} incorrect letters`;
        } else {
            return "You have 1 incorrect letter!"
        }
    }

    const placeTile = (tileContent, x, y) => {
        const tileProps = {
            key: `${x}${y}`,
            tileContent,
            y,
            x,
            finishMessagePixel: getTileBoardItem({ x, y }).finishMessagePixel === 1,
            tileSize: TILE_SIZE
        };
        const directionForTile = getTileBoardItem(tileProps).clueNumberLink ?
            getTileBoardItem(tileProps).clueNumberLink[game.direction] ?
                game.direction : getOppositeDirection(game.direction)
            : DEFAULT_DIRECTION;
        return (
            tileContent.answer ?
                <Tile
                    {...tileProps}
                    {...tilePositionConfig.current}
                    selected={game.selectedTile.x === x && game.selectedTile.y === y}
                    highlighted={!!game.highlightedTiles.find(hTile => hTile.x === x && hTile.y === y )}
                    onClick={() => {
                        if(directionForTile !== game.direction) {
                            game.direction = directionForTile;
                        }
                        activateTile(tileProps, directionForTile)
                    }}
                /> : <Block {...tileProps} {...tilePositionConfig.current} />
        )
    }

    const saveAndLeave = async () => {
        try {
            await saveGame();
            await leaveGame();
        } catch (e) {
            alert(e);
        }
    }

    return (
        <div className={classes.root}>
            <Grid container spacing={0}>
                <Grid container item spacing={0} justify="flex-end">
                    <Grid item>
                        <Button
                            style={{ backgroundColor: '#85dcb0', margin: '5px 20px 5px 20px' }}
                            variant="contained"
                            onClick={() => saveGame()}
                        >Save</Button>
                    </Grid>
                    <Grid item>
                        <Button
                            style={{ backgroundColor: '#41b3ac', margin: '5px 20px 5px 20px', color: 'white' }}
                            variant="contained"
                            onClick={() => saveAndLeave()}
                        >Save & Leave</Button>
                    </Grid>
                </Grid>
                <Grid item xs={12} sm={6} className={gameWon ? 'gameWon' : ''}>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox={`-1 -1 ${gameBoardSize + 2}
                        ${gameBoardSize + 2}`}
                        style={{ maxHeight: gameBoardSize, margin: '1.5em 20px 20px 20px' }}
                    >
                        <rect className='gameBoardBackground' x='-1' y='-1' width={gameBoardSize + 2} height={gameBoardSize + 2} />
                        <g>
                            {game.board.map((row, y) =>
                                row.map((tile, x) => placeTile(tile, x, y))
                            )}
                        </g>
                        <g>
                            <path d={grid(game.board.length, TILE_SIZE)} className="grid" vectorEffect="non-scaling-stroke" />
                        </g>
                    </svg>
                </Grid>
                <Grid item xs={12} sm={3}>
                    <span style={{ fontSize: '1.5em' }}>{CLUE_COLUMN_TITLE[HORIZONTAL]}</span>
                    <div style={{ height: `${500}px`, overflowY: 'scroll', marginRight: '10px' }}>
                        {game.clues[HORIZONTAL].map(clue => {
                            return <Clue
                                clue={clue}
                                handleClueClick={(id, tile) => handleClueClick(id, tile, HORIZONTAL)}
                                selected={clue.id === game.getTileClue()}
                                secondary={clue.id === game.getSecondaryTileClue()}
                            />
                        })}
                    </div>
                </Grid>
                <Grid item xs={12} sm={3}>
                    <span style={{ fontSize: '1.5em' }}>{CLUE_COLUMN_TITLE[VERTICAL]}</span>
                    <div style={{ height: `${500}px`, overflowY: 'scroll', marginRight: '10px' }}>
                        {game.clues[VERTICAL].map(clue => {
                            return <Clue
                                clue={clue}
                                handleClueClick={(id, tile) => handleClueClick(id, tile, VERTICAL)}
                                selected={clue.id === game.getTileClue()}
                                secondary={clue.id === game.getSecondaryTileClue()}
                            />
                        })}
                    </div>
                </Grid>
                <Snackbar
                    anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'center',
                    }}
                    open={incorrectGuessNumberOpen}
                    autoHideDuration={30 * 1000}
                    onClose={handleCloseIncorrectGuessNumber}
                    message={numberOfIncorrectGuessesText()}
                    ContentProps={{
                        classes: {
                            root: classes.snackbar
                        }
                    }}
                    action={
                      <React.Fragment>
                          <IconButton size="small" aria-label="close" color="inherit" onClick={handleCloseIncorrectGuessNumber}>
                              <CloseIcon fontSize="small" />
                          </IconButton>
                      </React.Fragment>
                  } />
            </Grid>
        </div>
    )
}

export default GameBoard;
