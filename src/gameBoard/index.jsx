import React, { useState, useEffect, useRef, useLayoutEffect } from 'react'
import useKeypress from 'react-use-keypress'

import './index.css';
import { FixedSizeList } from 'react-window';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import clone from 'lodash/clone';
import forEach from 'lodash/forEach';

import {
    TILE_SIZE,
    ALPHABET,
    ALPHABET_LOWER,
    HORIZONTAL,
    VERTICAL,
    ALL_DIRECTIONAL_KEYS,
    DEFAULT_DIRECTION,
    HORIZONTAL_ARROW_KEYS,
    VERTICAL_ARROW_KEYS, DELETE_KEYS, ARROW_KEY_MAPPINGS, TILE_ABOVE, TILE_BELOW, TILE_RIGHT, TILE_LEFT,
} from './constants'
import { EXAMPLE_BOARD , EXAMPLE_CLUES } from "./exampleData";

import { makeStyles } from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';

const useStyles = makeStyles((theme) => ({
    root: {
        flexGrow: 1,
    },
    selectedClue: {
        backgroundColor: '#85dcb0'
    },
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


const Cell = ({ tileContent, x: _x, y: _y, className, onClick, ...other }) => {
    const x = _x * TILE_SIZE;
    const y = _y * TILE_SIZE;
    return (
        <g>
            <rect
                x={x}
                y={y}
                height={TILE_SIZE}
                width={TILE_SIZE}
                className={className}
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

// TODO make key press wrap around to start
// useRef on direction to improve rendering times!
// reduce rerendering around highlights and tile selection by combining
// make everything look prettier
// figure out checking if complete (maybe based on number of letters entered. calculate how many missing?)

const GameBoard = () => {
    const [tileBoard, setTileBoard] = useState(EXAMPLE_BOARD);
    const [clues, setClues] = useState(EXAMPLE_CLUES);
    const [selectedTile, setSelectedTile] = useState({ x: null, y: null });
    const [highlightedTiles, setHighlightedTiles] = useState([]);
    const direction = useRef(DEFAULT_DIRECTION);
    const [timestamp, setTimestamp] = useState(Date.now());
    const [selectedClue, setSelectedClue] = useState(null);
    const numberOfFilledGuess = useRef(0);
    const totalNumberOfBoardLetters = useRef(0);
    const horizontalList = useRef();
    const verticalList = useRef();
    const [gameWon, setGameWon] = useState(false);

    const getTileBoardItem = ({x , y}) => tileBoard[y][x];

    const handleListItemClick = (clueTile, id, d) => {
        setSelectedClue(id);
        setSelectedTile(clueTile);
        direction.current = d;
        setHighlightedTiles(highlightTiles(clueTile, d));
    };

    useEffect(() => {
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

        const newTileBoard = clone(tileBoard);
        tileBoard.forEach((row, y) => {
            row.forEach((t, x) => {
                const newClueNumber = clueNumber;
                if(t.blank) {
                    return;
                }
                totalNumberOfBoardLetters.current++;
                const tile = {x, y}

                const tileAboveCoords = TILE_ABOVE(tile);

                if(!_isTile(tileAboveCoords)) {
                    if(_isTile(TILE_BELOW(tile))) {
                        updateClueNumber(newClueNumber, newTileBoard, tile);
                        const vClue = clues.VERTICAL[cluesWithTileRef.VERTICAL.length];
                        vClue.tile = tile;
                        vClue.id = clueId(VERTICAL, clueNumber);
                        vClue.clueNumber = clueNumber;
                        vClue.highlights = [];
                        cluesWithTileRef.VERTICAL.push(vClue);
                        vClue.highlights.push(tile);
                        newTileBoard[y][x].clueNumberLink =
                            { ...newTileBoard[y][x].clueNumberLink, VERTICAL: clueId(VERTICAL, clueNumber) };
                    }
                } else {
                    const tileAbove = newTileBoard[tileAboveCoords.y][tileAboveCoords.x];
                    newTileBoard[y][x].clueNumberLink =
                        { ...newTileBoard[y][x].clueNumberLink, VERTICAL: tileAbove.clueNumberLink.VERTICAL };
                    const previousVertClueHighlightChain = cluesWithTileRef.VERTICAL.find(clue => clue.highlights.find(
                        highlightedTile => highlightedTile.x === tileAboveCoords.x &&
                            highlightedTile.y === tileAboveCoords.y
                    ))
                    previousVertClueHighlightChain.highlights.push(tile)
                }

                const tileLeftCoords = TILE_LEFT(tile);


                if(!_isTile(tileLeftCoords)) {
                    if(_isTile(TILE_RIGHT(tile))) {
                        updateClueNumber(newClueNumber, newTileBoard, tile);
                        const vClue = clues.HORIZONTAL[cluesWithTileRef.HORIZONTAL.length];
                        vClue.tile = tile;
                        vClue.id = clueId(HORIZONTAL, clueNumber);
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
                    const previousVertClueHighlightChain = cluesWithTileRef.HORIZONTAL.find(clue => clue.highlights.find(
                        highlightedTile => highlightedTile.x === tileLeftCoords.x &&
                            highlightedTile.y === tileLeftCoords.y
                    ))
                    previousVertClueHighlightChain.highlights.push(tile);
                }
            })
        });
        setClues(cluesWithTileRef);
        setTileBoard(newTileBoard);
    }, []);

    const classes = useStyles();

    const arrowKeyPressInDirection = (pressedDirection, key) => {
        const arrowKeyMapping = ARROW_KEY_MAPPINGS[key];

        console.log("key press", Date.now())
        if(direction.current !== pressedDirection) {
            let nextTile = arrowKeyMapping(selectedTile)
            if(!getTileBoardItem(selectedTile).clueNumberLink[pressedDirection]) {
                for(let i = 1; _isLocationOnBoard(nextTile); i++, nextTile = arrowKeyMapping(selectedTile, i)) {
                    if(_isTile(nextTile)) {
                        let tileDirection = pressedDirection;
                        if(!getTileBoardItem(nextTile).clueNumberLink[tileDirection]) {
                            tileDirection = direction.current;
                        }
                        setSelectedTile(nextTile);
                        direction.current = tileDirection;
                        setHighlightedTiles(highlightTiles(nextTile, tileDirection))
                        setSelectedClue(getTileBoardItem(nextTile).clueNumberLink[tileDirection])
                        console.log(getTileBoardItem(nextTile).clueNumberLink[tileDirection]);
                        document.getElementById(getTileBoardItem(nextTile).clueNumberLink[tileDirection]).focus()
                        return;
                    }
                }
            } else {
                console.log("highlight tiles start", Date.now())
                setHighlightedTiles(highlightTiles(selectedTile, pressedDirection))
                // console.log("highlight tiles end", Date.now())
                direction.current = pressedDirection;
                // setSelectedClue(tileBoard[selectedTile.y][selectedTile.x].clueNumberLink[pressedDirection])
                console.log("highlight tiles end",Date.now())
            }
        } else {
            if(arrowKeyMapping) {
                let nextTile = arrowKeyMapping(selectedTile);
                for(let i = 1; _isLocationOnBoard(nextTile); i++) {
                    nextTile = arrowKeyMapping(selectedTile, i);
                    if(_isTile(nextTile)) {
                        setSelectedTile(nextTile);
                        if(i !== 1) {
                            let forceNewDirection = pressedDirection;
                            if(!getTileBoardItem(nextTile).clueNumberLink[pressedDirection]) {
                                forceNewDirection = Object.keys(tileBoard[nextTile.y][nextTile.x].clueNumberLink)[0];
                            }
                            direction.current = forceNewDirection;
                            setSelectedClue(getTileBoardItem(nextTile).clueNumberLink[forceNewDirection])
                            setHighlightedTiles(highlightTiles(nextTile, forceNewDirection))
                        }
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
        if(!_isTile(selectedTile)) {
            return;
        }
        if(selectedTile.guess === '') {
            numberOfFilledGuess.current++;
            if(numberOfFilledGuess.current === totalNumberOfBoardLetters.current) {
                checkBoardAnswersCorrect();
            }
        }
        getTileBoardItem(selectedTile).guess = key.toUpperCase();
        setTileBoard(tileBoard);
        moveSelectorOneSpaceInDirection();
    }

    const moveSelectorOneSpaceInDirection = () => {
        if(direction.current === HORIZONTAL && _isTile(TILE_RIGHT(selectedTile))) {
            setSelectedTile(TILE_RIGHT(selectedTile))
        } else if(direction.current === VERTICAL && _isTile(TILE_BELOW(selectedTile))) {
            setSelectedTile(TILE_BELOW(selectedTile))
        } else {
            setTimestamp(Date.now()); // force rerender
        }
    }

    const deleteLetter = key => {
        if(selectedTile.guess !== '') {
            numberOfFilledGuess.current--;
        }
        if(key == ' ') {
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
        console.log("key press start", Date.now())
        if([...ALL_DIRECTIONAL_KEYS].includes(key)) {
            arrowKeyPress(key);
            // const debouncedKeyPress = debounce(() => {
            //     arrowKeyPress(key);
            //     // setTimeout(() => arrowKeyPress(key), 0);
            // }, 100, {leading: true, maxWait:150, trailing: true});
            // debouncedKeyPress()
            // debouncedKeyPress.cancel();
            return;
        }
        if(key.length === 1 && key.match(/[a-z]/i)) {
            letterKeyPres(key);
            return;
        }
        if(DELETE_KEYS.includes(key)) {
            deleteLetter(key);
            return;
        }
    });

    const checkBoardAnswersCorrect = () => {
        let gameWon = true;
        forEach(gameWon, y => y.forEach(x => {
            if (x.guess !== x.answer) {
                gameWon = false;
                return false;
            }
        }))
        setGameWon(true);
    }

    const _isLocationOnBoard = ({ x, y }) => isLocationOnBoard(x, y);
    const isLocationOnBoard = (x, y) => x >= 0 && y >= 0 && x < tileBoard.length && y < tileBoard.length;
    const _isTile = ({ x, y }) => isTile(x, y);
    const isTile = (x, y) => {
        if(!isLocationOnBoard(x, y)) {
            return false;
        }
        return !getTileBoardItem({ x, y}).blank;
    }

    const highlightTiles = (selected, d = direction) =>
        clues[d].find(clue => clue.id === getTileBoardItem(selected).clueNumberLink[d]).highlights;

    const placeTile = (tileContent, x, y) => {
        const tile = { key: `${x}${y}`, tileContent, y, x};
        return (
            tileContent.answer ?
                <Tile
                    {...tile}
                    selected={selectedTile.x === x && selectedTile.y === y}
                    highlighted={!!highlightedTiles.find(hTile => hTile.x === x && hTile.y === y )}
                    onClick={e => {
                        e.preventDefault();
                        setSelectedTile(tile);
                        setHighlightedTiles(highlightTiles(tile, direction.current))
                        setSelectedClue(tileBoard[y][x].clueNumberLink[direction.current])
                        // console.log(clues[direction.current].findIndex(c => c.id === tileBoard[y][x].clueNumberLink[direction.current]))
                        // console.log(clues)
                        // console.log(tileBoard[y][x])
                        // focusSelectedClue(clues[direction.current].findIndex(c => c.id === tileBoard[y][x].clueNumberLink[direction.current]), direction.current)
                    }}
                /> : <Block {...tile} />
        )
    }

    const focusSelectedClue = (index, direction) => {
        if(direction === HORIZONTAL) {
            horizontalList.current.scrollToItem(index);
        } else {
            verticalList.current.scrollToItem(index);
        }
    }

    const clueId = (direction, i) => `${direction}${i}`;

    const clueRowWithDirection = direction => ({ index: i, style }) => {
        const clue = clues[direction][i];
        const selected = selectedClue === clue.id;
        return (
            <ListItem
                style={{
                    ...style,
                    ...(selected ? { backgroundColor: '#85dcb0' } : {}),
                }}
                key={clue.id}
                id={clue.id}
                button
                selected={selected}
                onClick={() => handleListItemClick(clue.tile, clue.id, direction)}
            >
                <ListItemIcon>
                    <div>{clue.clueNumber} </div>
                </ListItemIcon>
                <ListItemText primary={clue.clue} />
            </ListItem>
        )
    }

    const gameBoardSize = tileBoard.length * TILE_SIZE;

    return (
        <div className={classes.root}>
            <Grid container spacing={0}>
                <Grid item xs={6} className={gameWon ? 'gameWon' : ''}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox={`-1 -1 ${gameBoardSize + 2} ${gameBoardSize + 2}`} >
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
                    Across
                    <FixedSizeList ref={horizontalList} height={400} itemSize={46} itemCount={clues.HORIZONTAL.length}>
                        {clueRowWithDirection(HORIZONTAL)}
                    </FixedSizeList>
                </Grid>
                <Grid item xs={3}>
                    Down
                    <FixedSizeList ref={verticalList} height={400} itemSize={46} itemCount={clues.VERTICAL.length}>
                        {clueRowWithDirection(VERTICAL)}
                    </FixedSizeList>
                </Grid>
            </Grid>
        </div>
    )
}

export default GameBoard;
