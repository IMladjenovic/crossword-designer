import React, { useState, useEffect, useRef, useCallback, memo } from 'react'
import useKeypress from 'react-use-keypress'

import './index.css';
import Grid from '@material-ui/core/Grid';
import { VariableSizeList, areEqual } from 'react-window';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import Snackbar from '@material-ui/core/Snackbar';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';
import { makeStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import memoize from 'memoize-one';

import clone from 'lodash/clone';
import cloneDeep from 'lodash/cloneDeep';
import difference from 'lodash/difference';
import throttle from 'lodash/throttle';
import debounce from 'lodash/debounce';

import * as data1 from './crossword-template.json'

import { fonts, renderPixels } from 'js-pixel-fonts';

import {
    ALPHABET,
    ALPHABET_LOWER,
    DIRECTIONS,
    DEFAULT_DIRECTION,
    HORIZONTAL,
    VERTICAL,
    ALL_DIRECTIONAL_KEYS,
    HORIZONTAL_ARROW_KEYS,
    VERTICAL_ARROW_KEYS,
    CLEAR_LETTER_KEYS,
    DELETE_KEY,
    SPACE_KEY,
    BACKSPACE_KEY,
    ARROW_KEY_MAPPINGS,
    CLUE_COLUMN_TITLE,
    TILE_ABOVE,
    TILE_BELOW,
    TILE_RIGHT,
    TILE_LEFT,
} from './constants'
import {pickerOpts} from "../LoadGame";

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
                // style={}
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
    const [tileBoard, setTileBoard] = useState(data.init.tileBoard);
    const TILE_SIZE = useRef(data.tileSize).current;
    const tilePositionConfig = useRef(data.tilePositionConfig)

    const gameBoardSize = useRef(tileBoard.length * data.tileSize).current;
    const clueLineCharacterLimit = useRef(data.clueLineCharacterLimit ? data.clueLineCharacterLimit : 60);
    const [clues, setClues] = useState(data.init.cluesWithTileRef);
    const themeClues = useRef({ HORIZONTAL: {}, VERTICAL: {}, tiles: [] });
    const [selectedTile, setSelectedTile] = useState({ x: null, y: null });
    const [highlightedTiles, setHighlightedTiles] = useState([]);
    const direction = useRef(DEFAULT_DIRECTION);
    const [timestamp, setTimestamp] = useState(Date.now());
    const [selectedClue, setSelectedClue] = useState(null);
    const [secondaryClue, setSecondaryClue] = useState(null);
    const totalNumberOfBoardLetters = useRef(data.init.totalNumberOfBoardLetters);
    const horizontalList = useRef();
    const verticalList = useRef();
    const [gameWon, setGameWon] = useState(false);
    const [incorrectGuessNumberOpen, setIncorrectGuessNumberOpen] = useState(false);
    const throttledIncorrectGuessNumberOpen = useRef(throttle(() => setIncorrectGuessNumberOpen(true), 15000, { leading: true, trailing: false })).current;
    const incorrectGuesses = useRef(0);
    const selectedClueDebounce = useRef(debounce(value => setSelectedClue(value), RENDER_DEBOUNCE_LENGTH, RENDER_DEBOUNCE_OPTIONS)).current;
    const secondaryClueDebounce = useRef(debounce(value => setSecondaryClue(value), RENDER_DEBOUNCE_LENGTH, RENDER_DEBOUNCE_OPTIONS)).current;
    const focusClueDebounce = useRef(debounce((clueIndex, direction, ref) => focusClue(clueIndex, direction, ref), RENDER_DEBOUNCE_LENGTH, RENDER_DEBOUNCE_OPTIONS)).current;
    const focusSecondaryClueDebounce = useRef(debounce((clueIndex, direction, ref) => focusClue(clueIndex, direction, ref), RENDER_DEBOUNCE_LENGTH, RENDER_DEBOUNCE_OPTIONS)).current;
    const previousKeyWasDelete = useRef(false);

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

    // TODO
    // aamove styling to json file

    const arrowKeyPressInDirection = (pressedDirection, key) => {
        const arrowKeyMapping = ARROW_KEY_MAPPINGS[key];

        if(selectedTile.x === null || selectedTile.y === null) {
            console.log("Issue with selected tile", selectedTile)
        }

        if(direction.current !== pressedDirection) {
            let nextTile = arrowKeyMapping(selectedTile)
            if(!getTileBoardItem(selectedTile).clueNumberLink[pressedDirection]) {
                for(let i = 1; _isLocationOnBoard(nextTile); i++, nextTile = arrowKeyMapping(selectedTile, i)) {
                    if(isTile(nextTile)) {
                        let tileDirection = pressedDirection;
                        if(!getTileBoardItem(nextTile).clueNumberLink[tileDirection]) {
                            tileDirection = getOppositeDirection(pressedDirection);
                        }
                        direction.current = tileDirection;
                        activateTile(nextTile, tileDirection);
                        return;
                    }
                }
            } else {
                direction.current = pressedDirection;
                activateTile(selectedTile, pressedDirection, { selectTile: false });
            }
        } else {
            if(arrowKeyMapping) {
                let nextTile = arrowKeyMapping(selectedTile);
                for(let i = 1; _isLocationOnBoard(nextTile); i++) {
                    nextTile = arrowKeyMapping(selectedTile, i);
                    if(isTile(nextTile)) {
                        let options = { highlightTiles: false, selectedClue: false }
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

    const moveSelectorOneSpaceInDirection = (reverse = 1) => {
            const clueId = getTileBoardItem(selectedTile).clueNumberLink[direction.current];
            const clue = clues[direction.current].find(c => c.id === clueId);
            const numberOfLettersInAnswer = clue.highlights.length;
            const indexOfSelectedTileInAnswer = clue.highlights.findIndex(tile => tile.x === selectedTile.x && tile.y === selectedTile.y);
            const startingPos = direction.current === HORIZONTAL ? clue.tile.x : clue.tile.y;
            let foundEmptyTileInAnswer = false;
            for(let i = 0; i < numberOfLettersInAnswer; i++) {
                const index = (((i * reverse) + numberOfLettersInAnswer + indexOfSelectedTileInAnswer + 1) % numberOfLettersInAnswer) + startingPos;
                const hSuggestedClue = { x: index, y: selectedTile.y };
                const vSuggestedClue = { x: selectedTile.x, y: index };
                if(direction.current === HORIZONTAL && isTile(hSuggestedClue) && !getTileBoardItem(hSuggestedClue).guess) {
                    activateTile(hSuggestedClue, HORIZONTAL, { highlightTiles: false, selectClue: false })
                    foundEmptyTileInAnswer = true;
                    return;
                } else if(direction.current === VERTICAL && isTile(vSuggestedClue) && !getTileBoardItem(vSuggestedClue).guess) {
                    activateTile(vSuggestedClue, VERTICAL, { highlightTiles: false, selectClue: false })
                    foundEmptyTileInAnswer = true;
                    return;
                }
            }
            if(!foundEmptyTileInAnswer) {
                if(direction.current === HORIZONTAL && isTile(TILE_RIGHT(selectedTile))) {
                    activateTile(TILE_RIGHT(selectedTile), HORIZONTAL, { highlightTiles: false, selectClue: false })
                } else if(direction.current === VERTICAL && isTile(TILE_BELOW(selectedTile))) {
                    activateTile(TILE_BELOW(selectedTile), VERTICAL, { highlightTiles: false, selectClue: false })
                } else {
                    setTimestamp(Date.now()); // force rerender
                }
            }
    }

    const removeGuessFromTile = selectedTile => {
        getTileBoardItem(selectedTile).guess = '';
        setTileBoard(tileBoard);
        // setTimestamp(Date.now()); // force rerender
    }

    const clearLetterKey = key => {
        if(key === SPACE_KEY) {
            const shouldOnlySingleSpaceMove = getTileBoardItem(selectedTile).guess !== '' || previousKeyWasDelete.current === true;
            if(direction.current === HORIZONTAL && shouldOnlySingleSpaceMove) {
                previousKeyWasDelete.current = true;
                removeGuessFromTile(selectedTile);
                if(isTile(TILE_RIGHT(selectedTile))) {
                    setSelectedTile(TILE_RIGHT(selectedTile))
                } else {
                    const clueId = getTileBoardItem(selectedTile).clueNumberLink[direction.current];
                    const clue = clues[HORIZONTAL].find(c => c.id === clueId);
                    const beginningClue = clue.highlights[0];
                    setSelectedTile(beginningClue)
                }
            } else if(direction.current === VERTICAL && shouldOnlySingleSpaceMove) {
                previousKeyWasDelete.current = true;
                removeGuessFromTile(selectedTile);
                if(isTile(TILE_BELOW(selectedTile))) {
                    setSelectedTile(TILE_BELOW(selectedTile))
                } else {
                    const clueId = getTileBoardItem(selectedTile).clueNumberLink[direction.current];
                    const clue = clues[VERTICAL].find(c => c.id === clueId);
                    const beginningClue = clue.highlights[0];
                    setSelectedTile(beginningClue)
                }
            } else {
                // setTimestamp(Date.now()); // force rerender
                moveSelectorOneSpaceInDirection();
            }
        } else if(key === BACKSPACE_KEY) {
            if(getTileBoardItem(selectedTile).guess !== '') {
                removeGuessFromTile(selectedTile);
                setTimestamp(Date.now())
            } else if(direction.current === HORIZONTAL && isTile(TILE_LEFT(selectedTile))) {
                removeGuessFromTile(TILE_LEFT(selectedTile));
                previousKeyWasDelete.current = true;
                setSelectedTile(TILE_LEFT(selectedTile))
            } else if(direction.current === VERTICAL && isTile(TILE_ABOVE(selectedTile))) {
                removeGuessFromTile(TILE_ABOVE(selectedTile));
                previousKeyWasDelete.current = true;
                setSelectedTile(TILE_ABOVE(selectedTile))
            }
            removeGuessFromTile(selectedTile);
            setTimestamp(Date.now())
        } else if(key === DELETE_KEY) {
            removeGuessFromTile(selectedTile);
            setTimestamp(Date.now())
        }
    }

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
        preventKeyPress.current = true;
        setTimeout(() => preventKeyPress.current = false, 10);
        if([...ALL_DIRECTIONAL_KEYS].includes(key)) {
            arrowKeyPress(key);
            previousKeyWasDelete.current = false;
            return;
        }
        if(key.length === 1 && key.match(/[a-z]/i)) {
            letterKeyPres(key);
            previousKeyWasDelete.current = false;
            return;
        }
        if(CLEAR_LETTER_KEYS.includes(key)) {
            clearLetterKey(key);
        }
    });

    const checkBoardAnswersCorrect = () => {
        if(gameWon) {
            return;
        }

        let countIncorrectGuesses = 0;
        tileBoard.forEach((row, y) => row.forEach((tile, x) => {
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

        const tileBoardSnapshot = cloneDeep(tileBoard);
        const messageBoard = cloneDeep(tileBoard);
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
        const newHandle = await window.showSaveFilePicker(pickerOpts);

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

    const getTileClue = (tile, direction) => getTileBoardItem(tile).clueNumberLink[direction];

    const activateTile = (
        tile,
        direction,
        {
            selectClue = true,
            highlightTiles = true,
            selectTile = true,
            focusClue = true,
            selectSecondaryClue = true
        } = {}
    ) => {
        if(selectTile) {
            setSelectedTile(tile);
        }
        if(highlightTiles) {
            let highlightTiles = [];
            if(themeClues.current[direction][getTileClue(tile, direction)]) {
                highlightTiles.push(...themeClues.current.tiles);
            }
            highlightTiles.push(...getTileHighlights(tile, direction));
            setHighlightedTiles(highlightTiles)
        }
        if(selectClue) {
            selectedClueDebounce(getTileClue(tile, direction));
        }
        if(selectSecondaryClue) {
            secondaryClueDebounce(getTileClue(tile, getOppositeDirection(direction)));
        }
        if(focusClue) {
            const primaryClueId = getTileClue(tile, direction);
            const primaryClueIndex = clues[direction].findIndex(c => c.id === primaryClueId);
            if(primaryClueIndex >= 0) {
                focusClueDebounce(primaryClueIndex, direction, getRefForListByDirection(direction))
            }

            const oppositeDirection = getOppositeDirection(direction);
            const secondaryClueId = getTileClue(tile, oppositeDirection);
            const secondaryClueIndex = clues[oppositeDirection].findIndex(c => c.id === secondaryClueId);
            if(secondaryClueIndex >= 0) {
                focusSecondaryClueDebounce(secondaryClueIndex, oppositeDirection, getRefForListByDirection(oppositeDirection));
            }
        }
    }

    const getRefForListByDirection = direction => direction === HORIZONTAL ? horizontalList.current : verticalList.current

    const focusClue = (index, direction, ref) => {
        ref.scrollToItem(index, "center")
    }

    const numberOfIncorrectGuessesText = () => {
        if(incorrectGuesses.current > 1) {
            return `You have ${incorrectGuesses.current} incorrect letters`;
        } else {
            return "You have 1 incorrect letter!"
        }
    }

    const clueId = (direction, i) => `${direction}${i}`;

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
            getTileBoardItem(tileProps).clueNumberLink[direction.current] ?
                direction.current : getOppositeDirection(direction.current)
            : DEFAULT_DIRECTION;
        return (
            tileContent.answer ?
                <Tile
                    {...tileProps}
                    {...tilePositionConfig.current}
                    selected={selectedTile.x === x && selectedTile.y === y}
                    highlighted={!!highlightedTiles.find(hTile => hTile.x === x && hTile.y === y )}
                    onClick={() => {
                        if(directionForTile !== direction.current) {
                            direction.current = directionForTile;
                        }
                        activateTile(tileProps, directionForTile)
                    }}
                /> : <Block {...tileProps} {...tilePositionConfig.current} />
        )
    }

    const clueRowWithDirection = direction => memo(({ data, index: i, style }) => {
        const { clues, selectedClue, secondaryClue } = data;
        if(clues) {
            const clue = clues[i];
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
                        <div>{clue.clueNumber}</div>
                    </ListItemIcon>
                    <ListItemText primary={clue.clue} />
                </ListItem>
            )
        } else {
            return (
                <ListItem>{i}</ListItem>
            )
        }
    }, areEqual)

    const saveAndLeave = async () => {
        try {
            await saveGame();
            await leaveGame();
        } catch (e) {
            alert(e);
        }
    }

    const createItemData = memoize((clues, selectedClue, secondaryClue) => ({
        clues,
        selectedClue,
        secondaryClue
    }));

    const getItemSize = direction => index => {
        // const size = clues[direction][index].clue.length > 60 ? 2 : 1;
        const multiple = Math.ceil(clues[direction][index].clue.length / clueLineCharacterLimit.current);
        return multiple * (gameBoardSize / 10);
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
                            {tileBoard.map((row, y) =>
                                row.map((tile, x) => placeTile(tile, x, y))
                            )}
                        </g>
                        <g>
                            <path d={grid(tileBoard.length, TILE_SIZE)} className="grid" vectorEffect="non-scaling-stroke" />
                        </g>
                    </svg>
                </Grid>
                <Grid item xs={12} sm={3}>
                    <span style={{ fontSize: '1.5em' }}>{CLUE_COLUMN_TITLE[HORIZONTAL]}</span>
                    <VariableSizeList itemSize={getItemSize(HORIZONTAL)} style={{ margin: '0 5px' }} ref={horizontalList} itemData={createItemData(clues[HORIZONTAL], selectedClue, secondaryClue)}  height={gameBoardSize} itemCount={clues[HORIZONTAL].length}>
                        {clueRowWithDirection(HORIZONTAL)}
                    </VariableSizeList>
                </Grid>
                <Grid item xs={12} sm={3}>
                    <span style={{ fontSize: '1.5em' }}>{CLUE_COLUMN_TITLE[VERTICAL]}</span>
                    <VariableSizeList itemSize={getItemSize(VERTICAL)} style={{ margin: '0 5px' }} ref={verticalList} itemData={createItemData(clues[VERTICAL], selectedClue, secondaryClue)} height={gameBoardSize} itemCount={clues[VERTICAL].length}>
                        {clueRowWithDirection(VERTICAL)}
                    </VariableSizeList>
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
