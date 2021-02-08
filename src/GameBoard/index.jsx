import React, { useState, useEffect, useRef, useCallback } from 'react'
import useKeypress from 'react-use-keypress'

import './index.css';
import Grid from '@material-ui/core/Grid';
import { FixedSizeList } from 'react-window';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import Snackbar from '@material-ui/core/Snackbar';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';
import { makeStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';

import clone from 'lodash/clone';
import cloneDeep from 'lodash/cloneDeep';
import difference from 'lodash/difference';
import throttle from 'lodash/throttle';

import data from './save-game.json';

import { fonts, renderPixels } from 'js-pixel-fonts';

import {
    // TILE_SIZE,
    ALPHABET,
    ALPHABET_LOWER,
    DIRECTIONS,
    DEFAULT_DIRECTION,
    HORIZONTAL,
    VERTICAL,
    ALL_DIRECTIONAL_KEYS,
    HORIZONTAL_ARROW_KEYS,
    VERTICAL_ARROW_KEYS,
    DELETE_KEYS,
    ARROW_KEY_MAPPINGS,
    TILE_ABOVE,
    TILE_BELOW,
    TILE_RIGHT,
    TILE_LEFT,
} from './constants'

const TILE_SIZE = (window.screen.height - (350)) / data.gameBoard.length;
// const TILE_SIZE = 20;
console.log(TILE_SIZE);
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

const grid = nTiles => {
    let grid = '';
    const lineLength = (nTiles * TILE_SIZE) + 0.5;
    for(let i = 0; i < nTiles + 1; i++) {
        const lineStart = (i * TILE_SIZE);
        grid = `${grid} M0.00,${lineStart} l${lineLength},0.00 M${lineStart},0.00 l0.00,${lineLength} `;
    }
    return grid;
}

const Cell = ({ tileContent, x: _x, y: _y, className, onClick, finishMessagePixel, ...other }) => {
    const x = _x * TILE_SIZE;
    const y = _y * TILE_SIZE;
    return (
        <g>
            <rect
                x={x}
                y={y}
                height={TILE_SIZE}
                width={TILE_SIZE}
                // style={}
                className={finishMessagePixel ? "finishMessagePixel" : className}
                onClick={onClick}
                {...other}
            />
            <text x={x + 1.5} y={y + 10}  className='clueNumber' onClick={onClick}>{tileContent.clueNumber || ''}</text>
            <text x={x + (TILE_SIZE / 4)} y={y + (7 * (TILE_SIZE / 8))} className='guess' onClick={onClick}>{tileContent.guess}</text>
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

const GameBoard = () => {
    const numberOfTiles = useRef(data.gameBoard.length)
    const [tileBoard, setTileBoard] = useState(data.gameBoard);
    const [clues, setClues] = useState(data.clues);
    const themeClues = useRef({ HORIZONTAL: {}, VERTICAL: {}, tiles: [] });
    const [selectedTile, setSelectedTile] = useState({ x: null, y: null });
    const [highlightedTiles, setHighlightedTiles] = useState([]);
    const direction = useRef(DEFAULT_DIRECTION);
    const [timestamp, setTimestamp] = useState(Date.now());
    const [selectedClue, setSelectedClue] = useState(null);
    const [secondaryClue, setSecondaryClue] = useState(null);
    const totalNumberOfBoardLetters = useRef(0);
    const horizontalList = useRef();
    const verticalList = useRef();
    const [gameWon, setGameWon] = useState(false);
    const [incorrectGuessNumberOpen, setIncorrectGuessNumberOpen] = useState(false);
    const throttledIncorrectGuessNumberOpen = useRef(throttle(() => setIncorrectGuessNumberOpen(true), 15000, { leading: true, trailing: true })).current;
    const incorrectGuesses = useRef(0);

    // finished game config
    const preventKeyPress = useRef(false);

    const getTileBoardItem = ({x , y}) => tileBoard[y][x];

    const handleClueClick = (clueTile, id, d) => {
        direction.current = d;
        activateTile(clueTile, d)
    };

    const handleCloseIncorrectGuessNumber = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }

        setIncorrectGuessNumberOpen(false);
        setTimeout(() => incorrectGuesses.current = 0, 3000);
    };

    const prepareGameFinishedScreen = () => {
        data.customGlyphs.forEach(glyph => {
            const key = Object.keys(glyph)[0];
            fonts.sevenPlus.glyphs[key] = glyph[key];
        })
    }

    useEffect(() => {
        prepareGameFinishedScreen();
        let clueNumber = 0;
        const cluesWithTileRef = {
            HORIZONTAL: [],
            VERTICAL: []
        }

        if(!clues.HORIZONTAL || !clues.VERTICAL) {
            return;
        }

        const updateClueNumber = (newClueNumber, newTileBoard, tile) => {
            if(clueNumber !== newClueNumber) {
                return;
            }
            clueNumber++;
            newTileBoard[tile.y][tile.x].clueNumber = clueNumber;
        }

        const shouldUpdateTotalNumberOfBoardLetters = totalNumberOfBoardLetters.current === 0;

        const newTileBoard = clone(tileBoard);
        tileBoard.forEach((row, y) => {
            row.forEach((t, x) => {
                const newClueNumber = clueNumber;
                if(t.blank) {
                    return;
                }
                if(shouldUpdateTotalNumberOfBoardLetters) {
                    totalNumberOfBoardLetters.current++;
                }
                const tile = {x, y}

                const tileAboveCoords = TILE_ABOVE(tile);

                if(!isTile(tileAboveCoords)) {
                    if(isTile(TILE_BELOW(tile))) {
                        updateClueNumber(newClueNumber, newTileBoard, tile);
                        const vClue = clues.VERTICAL[cluesWithTileRef.VERTICAL.length];

                        vClue.tile = tile;
                        vClue.id = clueId(VERTICAL, clueNumber);
                        vClue.clueNumber = clueNumber;
                        vClue.highlights = [];
                        if(vClue.theme) {
                            themeClues.current[VERTICAL][vClue.id] = true;
                            themeClues.current.tiles.push(tile);
                        }

                        vClue.highlights.push(tile);
                        newTileBoard[y][x].clueNumberLink =
                            { ...newTileBoard[y][x].clueNumberLink, VERTICAL: clueId(VERTICAL, clueNumber) };
                        cluesWithTileRef.VERTICAL.push(vClue);
                    }
                } else {
                    const tileAbove = newTileBoard[tileAboveCoords.y][tileAboveCoords.x];
                    newTileBoard[y][x].clueNumberLink =
                        { ...newTileBoard[y][x].clueNumberLink, VERTICAL: tileAbove.clueNumberLink.VERTICAL };
                    if(tileAbove.theme) {
                        themeClues.current[VERTICAL][tileAbove.id] = true;
                        themeClues.current.tiles.push(tile);
                    }
                    const previousVertClueHighlightChain = cluesWithTileRef.VERTICAL.find(clue => clue.highlights.find(
                        highlightedTile => highlightedTile.x === tileAboveCoords.x &&
                            highlightedTile.y === tileAboveCoords.y
                    ))
                    previousVertClueHighlightChain.highlights.push(tile)
                    if(previousVertClueHighlightChain.theme) {
                        themeClues.current[VERTICAL][previousVertClueHighlightChain.id] = true;
                        themeClues.current.tiles.push(tile);
                    }
                }

                const tileLeftCoords = TILE_LEFT(tile);


                if(!isTile(tileLeftCoords)) {
                    if(isTile(TILE_RIGHT(tile))) {
                        updateClueNumber(newClueNumber, newTileBoard, tile);
                        const vClue = clues.HORIZONTAL[cluesWithTileRef.HORIZONTAL.length];
                        vClue.tile = tile;
                        vClue.id = clueId(HORIZONTAL, clueNumber);
                        if(vClue.theme) {
                            themeClues.current[HORIZONTAL][vClue.id] = true;
                            themeClues.current.tiles.push(tile);
                        }
                        vClue.clueNumber = clueNumber;
                        vClue.highlights = [];
                        cluesWithTileRef.HORIZONTAL.push(vClue);
                        vClue.highlights.push(tile);
                        newTileBoard[y][x].clueNumberLink =
                            { ...newTileBoard[y][x].clueNumberLink, HORIZONTAL: clueId(HORIZONTAL, clueNumber) };
                    }
                } else {
                    const tileLeft = newTileBoard[tileLeftCoords.y][tileLeftCoords.x];
                    newTileBoard[y][x].clueNumberLink =
                        { ...newTileBoard[y][x].clueNumberLink, HORIZONTAL: tileLeft.clueNumberLink.HORIZONTAL };
                    if(tileLeft.theme) {
                        themeClues.current[HORIZONTAL][tileLeft.id] = true;
                        themeClues.current.tiles.push(tile);
                    }
                    const previousVertClueHighlightChain = cluesWithTileRef.HORIZONTAL.find(clue => clue.highlights.find(
                        highlightedTile => highlightedTile.x === tileLeftCoords.x &&
                            highlightedTile.y === tileLeftCoords.y
                    ))
                    previousVertClueHighlightChain.highlights.push(tile);
                    if(previousVertClueHighlightChain.theme) {
                        themeClues.current[HORIZONTAL][previousVertClueHighlightChain.id] = true;
                        themeClues.current.tiles.push(tile);
                    }
                }
            })
        });
        setClues(cluesWithTileRef);
        setTileBoard(newTileBoard);
    }, []);

    const classes = useStyles();

    // TODO
    // aamove styling to json file

    const arrowKeyPressInDirection = (pressedDirection, key) => {
        const arrowKeyMapping = ARROW_KEY_MAPPINGS[key];

        if(direction.current !== pressedDirection) {
            let nextTile = arrowKeyMapping(selectedTile)
            if(!getTileBoardItem(selectedTile).clueNumberLink[pressedDirection]) {
                for(let i = 1; _isLocationOnBoard(nextTile); i++, nextTile = arrowKeyMapping(selectedTile, i)) {
                    if(isTile(nextTile)) {
                        let tileDirection = pressedDirection;
                        if(!getTileBoardItem(nextTile).clueNumberLink[tileDirection]) {
                            tileDirection = direction.current;
                        }
                        direction.current = tileDirection;
                        activateTile(nextTile, tileDirection);
                        return;
                    }
                }
            } else {
                direction.current = pressedDirection;
                activateTile(selectedTile, pressedDirection, { selectTile: false});
            }
        } else {
            if(arrowKeyMapping) {
                let nextTile = arrowKeyMapping(selectedTile);
                for(let i = 1; _isLocationOnBoard(nextTile); i++) {
                    nextTile = arrowKeyMapping(selectedTile, i);
                    if(isTile(nextTile)) {
                        let options = { selectClue: false, highlightTiles: false, focusClue: false }
                        if(i !== 1) {
                            options = {};
                            if(!getTileClue(nextTile, pressedDirection)) {
                                pressedDirection = Object.keys(tileBoard[nextTile.y][nextTile.x].clueNumberLink)[0];
                            }
                            direction.current = pressedDirection;
                        }
                        activateTile(nextTile, pressedDirection, options)
                        return;
                    }
                }
            }
        }
    }

    const arrowKeyPress = key => {
        if(HORIZONTAL_ARROW_KEYS.includes(key)) {
            arrowKeyPressInDirection(HORIZONTAL, key);
        } else if(VERTICAL_ARROW_KEYS.includes(key)) {
            arrowKeyPressInDirection(VERTICAL, key);
        }
    }

    const letterKeyPres = key => {
        if(!isTile(selectedTile)) {
            return;
        }
        getTileBoardItem(selectedTile).guess = key.toUpperCase();
        setTileBoard(tileBoard);
        moveSelectorOneSpaceInDirection();

        let numberOfGuesses = 0;
        tileBoard.forEach(row => row.forEach(tile => tile.guess && numberOfGuesses++));
        if(numberOfGuesses === totalNumberOfBoardLetters.current) {
            checkBoardAnswersCorrect();
        }

    }

    const moveSelectorOneSpaceInDirection = () => {
            const clueId = getTileBoardItem(selectedTile).clueNumberLink[direction.current];
            const clue = clues[direction.current].find(c => c.id === clueId);
            const numberOfLettersInAnswer = clue.highlights.length;
            const indexOfSelectedTileInAnswer = clue.highlights.findIndex(tile => tile.x === selectedTile.x && tile.y === selectedTile.y);
            const startingPos = direction.current === HORIZONTAL ? clue.tile.x : clue.tile.y;
            let foundEmptyTileInAnswer = false;
            for(let i = 0; i < numberOfLettersInAnswer; i++) {
                const index = ((i + numberOfLettersInAnswer + indexOfSelectedTileInAnswer + 1) % numberOfLettersInAnswer) + startingPos;
                const hSuggestedClue = { x: index, y: selectedTile.y };
                const vSuggestedClue = { x: selectedTile.x, y: index };
                if(direction.current === HORIZONTAL && isTile(hSuggestedClue) && !getTileBoardItem(hSuggestedClue).guess) {
                    setSelectedTile(hSuggestedClue)
                    foundEmptyTileInAnswer = true;
                    return;
                } else if(direction.current === VERTICAL && isTile(vSuggestedClue) && !getTileBoardItem(vSuggestedClue).guess) {
                    setSelectedTile(vSuggestedClue)
                    foundEmptyTileInAnswer = true;
                    return;
                }
            }
            if(!foundEmptyTileInAnswer) {
                if(direction.current === HORIZONTAL && isTile(TILE_RIGHT(selectedTile))) {
                    setSelectedTile(TILE_RIGHT(selectedTile))
                } else if(direction.current === VERTICAL && isTile(TILE_BELOW(selectedTile))) {
                    setSelectedTile(TILE_BELOW(selectedTile))
                } else {
                    setTimestamp(Date.now()); // force rerender
                }
            }
    }

    const deleteLetter = key => {
        if(key === ' ') {
            moveSelectorOneSpaceInDirection();
        }
        getTileBoardItem(selectedTile).guess = '';
        setTileBoard(tileBoard);
        setTimestamp(Date.now()); // force rerender
    }

    useKeypress([
        ...VERTICAL_ARROW_KEYS,
        ...HORIZONTAL_ARROW_KEYS,
        ...ALPHABET,
        ...ALPHABET_LOWER,
        ...DELETE_KEYS
    ], ({ key }) => {
        if(preventKeyPress.current || gameWon) {
            return;
        }
        preventKeyPress.current = true;
        setTimeout(() => preventKeyPress.current = false, 15);
        if([...ALL_DIRECTIONAL_KEYS].includes(key)) {
            arrowKeyPress(key);
            return;
        }
        if(key.length === 1 && key.match(/[a-z]/i)) {
            letterKeyPres(key);
            checkBoardAnswersCorrect()
            return;
        }
        if(DELETE_KEYS.includes(key)) {
            deleteLetter(key);
            return;
        }
    });

    const checkBoardAnswersCorrect = () => {
        if(gameWon) {
            return;
        }

        let countIncorrectGuesses = 0;
        tileBoard.forEach((row, y) => row.forEach((tile, x) => {
            if (tile.guess !== data.gameBoard[y][x].answer) {
                countIncorrectGuesses++;
            }
        }))
        if(countIncorrectGuesses !== 0) {
            incorrectGuesses.current = countIncorrectGuesses;
            throttledIncorrectGuessNumberOpen();
            return;
        }

        setGameWon(true);

        const tileBoardSnapshot = cloneDeep(tileBoard);
        const messageBoard = cloneDeep(tileBoard);
        const messageBoardSnapshots = []

        // config
        const startDelay = 3000;
        const messageSpeed = 250;
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
            messageBoardSnapshots.forEach((snapshotOfBoard, i) => setTimeout(() => setTileBoard(snapshotOfBoard), startDelay + (messageSpeed * i)));
            const gameTimeEnd = startDelay + (messageBoardSnapshots.length * messageSpeed);
            setTimeout(() => {
                setGameWon(false);
                setTileBoard(tileBoardSnapshot);
                preventKeyPress.current = false;
            }, gameTimeEnd + startDelay);
        }
    }

    const _isLocationOnBoard = ({ x, y }) => isLocationOnBoard(x, y);
    const isLocationOnBoard = (x, y) => x >= 0 && y >= 0 && x < tileBoard.length && y < tileBoard.length;
    const isTile = ({ x, y }) => isTileAtCoords(x, y);
    const isTileAtCoords = (x, y) => {
        if(!isLocationOnBoard(x, y)) {
            return false;
        }
        return !getTileBoardItem({ x, y}).blank;
    }

    const saveGame = async () => {
        data.gameBoard = tileBoard;
        const jsonSave = JSON.stringify(data);

        // create a new handle
        const newHandle = await window.showSaveFilePicker();

        // create a FileSystemWritableFileStream to write to
        const writableStream = await newHandle.createWritable();

        // write our file
        const blob = new Blob([jsonSave], {type : 'application/json'});
        await writableStream.write(blob);

        // close the file and write the contents to disk.
        await writableStream.close();
    }

    const getTileHighlights = (tile, d = direction) =>
        clues[d].find(clue => clue.id === getTileClue(tile, d)).highlights;

    const getOppositeDirection = direction => {
        if(DIRECTIONS.includes(direction)) {
            return difference(DIRECTIONS, [direction])[0];
        } else {
            throw new Error("tried to get opposite direction of " + direction);
        }
    }

    const placeTile = (tileContent, x, y) => {
        const tile = { key: `${x}${y}`, tileContent, y, x};
        const directionForTile = getTileBoardItem(tile).clueNumberLink ?
                getTileBoardItem(tile).clueNumberLink[direction.current] ?
                    direction.current : getOppositeDirection(direction.current)
                : DEFAULT_DIRECTION;
        return (
            tileContent.answer ?
                <Tile
                    {...tile}
                    selected={selectedTile.x === x && selectedTile.y === y}
                    highlighted={!!highlightedTiles.find(hTile => hTile.x === x && hTile.y === y )}
                    finishMessagePixel={getTileBoardItem(tile).finishMessagePixel === 1}
                    onClick={e => {
                        e.preventDefault();
                        if(directionForTile !== direction.current) {
                            direction.current = directionForTile;
                        }
                        activateTile(tile, directionForTile)
                    }}
                /> : <Block {...tile} finishMessagePixel={getTileBoardItem(tile).finishMessagePixel === 1} />
        )
    }

    const getTileClue = (tile, direction) => getTileBoardItem(tile).clueNumberLink[direction];

    const activateTile = (
        tile,
        direction,
        {
            selectClue = true,
            highlightTiles = true,
            selectTile = true,
            focusClue = true
        } = {}
    ) => {
        if(highlightTiles) {
            let highlightTiles = [];
            if(themeClues.current[direction][getTileClue(tile, direction)]) {
                highlightTiles.push(...themeClues.current.tiles);
            }
            highlightTiles.push(...getTileHighlights(tile, direction));
            setHighlightedTiles(highlightTiles)
        }
        if(selectTile) {
            setSelectedTile(tile);
        }
        if(selectClue) {
            setSelectedClue(getTileClue(tile, direction))
            // const secondaryClue = getTileClue(tile, getOppositeDirection(direction));
            // if(secondaryClue) {
                setSecondaryClue(getTileClue(tile, getOppositeDirection(direction)));
            // } else {
            //     setSecondaryClue(null);
            // }
        }
        if(focusClue) {
            focusSelectedClue(clues[direction].findIndex(c => c.id === getTileClue(tile, direction)), direction)
            const oppositeDirection = getOppositeDirection(direction);
            if(oppositeDirection) {
                focusSelectedClue(clues[oppositeDirection].findIndex(c => c.id === getTileClue(tile, oppositeDirection)), oppositeDirection)
            }
        }
    }

    const focusSelectedClue = (index, direction) => {
        let scrollType = 'center';
        if(index > 5 && index < 11) {
            index = index - 3;
            scrollType = 'start'
        }
        if(index > numberOfTiles - 11 && index < numberOfTiles - 5) {
            index = index + 3;
            scrollType = 'end'
        }
        if(direction === HORIZONTAL) {
            horizontalList.current.scrollToItem(index, scrollType);
        } else {
            verticalList.current.scrollToItem(index, scrollType);
        }
    }

    const numberOfIncorrectGuessesText = () => {
        if(incorrectGuesses.current > 10) {
            return "You have more than 10 incorrect letters";
        } else if(incorrectGuesses.current > 5) {
            return "You have more than 5 incorrect letters";
        } else {
            return "You have 5 or less incorrect letters!"
        }
    }

    const clueId = (direction, i) => `${direction}${i}`;

    const clueRowWithDirection = direction => ({ index: i, style }) => {
        const clue = clues[direction][i];
        const selected = selectedClue === clue.id;
        const secondary = secondaryClue === clue.id;
        return (
            <ListItem
                style={{
                    ...style,
                    ...(selected ? { backgroundColor: '#85dcb0' } :
                        secondary ? { backgroundColor: '#85dcb0', opacity: '50%' } : {})
                }}
                key={clue.id}
                id={clue.id}
                button
                selected={selected}
                onClick={() => handleClueClick(clue.tile, clue.id, direction)}
            >
                <ListItemIcon>
                    <div>{clue.clueNumber} </div>
                </ListItemIcon>
                <ListItemText primary={clue.clue} />
            </ListItem>
        )
    }

    const ClueColumn = ({ direction, customRef }) =>
        <div>
            <span style={{ fontSize: '1.5em' }}>Across</span>
            <FixedSizeList style={{ margin: '0 5px', lineHeight: '1' }} ref={customRef} height={gameBoardSize} itemSize={gameBoardSize / 10} itemCount={clues[direction].length}>
                {clueRowWithDirection(direction)}
            </FixedSizeList>
        </div>

    const gameBoardSize = tileBoard.length * TILE_SIZE;

    return (
        <div className={classes.root}>
            <Grid container spacing={0}>
                <Grid item xs={6} className={gameWon ? 'gameWon' : ''}>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox={`-1 -1 ${gameBoardSize + 2}
                        ${gameBoardSize + 2}`}
                        style={{ maxHeight: gameBoardSize, margin: '1.5em 20px 20px 20px' }}
                    >
                        <rect className='gameBoardBackground' x='-1' y='-1' width={gameBoardSize + 2} height={gameBoardSize + 2} />
                        <g>
                            {tileBoard.map((row, y) =>
                                row.map((tile, x) => placeTile(tile, x, y))
                            )}
                        </g>
                        <g>
                            <path d={grid(tileBoard.length)} className="grid" vectorEffect="non-scaling-stroke" />
                        </g>
                    </svg>
                </Grid>
                <Grid item xs={3}>
                    <ClueColumn direction={HORIZONTAL} customRef={horizontalList} />
                </Grid>
                <Grid item xs={3}>
                    <ClueColumn direction={VERTICAL} customRef={verticalList} />
                </Grid>
                <Button
                    style={{ backgroundColor: '#85dcb0' }}
                    variant="contained"
                    onClick={() => saveGame()}
                >Save</Button>
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
