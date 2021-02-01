import React, { useState, useEffect } from 'react'
import useKeypress from 'react-use-keypress'

import './index.css';
import Fix from '@material-ui/core/List';
import { FixedSizeList } from 'react-window';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';

import {
    TILE_SIZE,
    ALPHABET,
    ALPHABET_LOWER,
    HORIZONTAL,
    VERTICAL,
    ARROW_LEFT,
    ARROW_RIGHT,
    ARROW_UP,
    ARROW_DOWN,
    DEFAULT_DIRECTION,
    HORIZONTAL_ARROW_KEYS,
    VERTICAL_ARROW_KEYS, DELETE_KEYS,
} from './constants'
import { EXAMPLE_BOARD , EXAMPLE_CLUES } from "./tileBoard";

import { makeStyles } from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';

const useStyles = makeStyles((theme) => ({
    root: {
        flexGrow: 1,
    },
    selectedClue: {
        backgroundColor: '#0ff'
    },
}));

const grid = nTiles => {
    let grid = '';
    const lineLength = nTiles * TILE_SIZE;
    for(let i = 0; i < nTiles; i++) {
        grid = `${grid} M0.00,${i * TILE_SIZE} l${lineLength},0.00 M${i * TILE_SIZE},0.00 l0.00,${lineLength} `;
    }
    return grid;
}


const Cell = ({ tileContent, x: _x, y: _y, className, ...other }) => {
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
                {...other}
            />
            <text x={x + 1} y={y + 5} className='clueNumber'>{tileContent.clueNumber || ''}</text>
            <text x={x + (TILE_SIZE / 2)} y={y + TILE_SIZE} className='guess'>{tileContent.guess}</text>
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
// add clues
// link clues to crossword and vice versa
// Add auto line numbering
// make everything look prettier
// figure out checking if complete (maybe based on number of letters entered. calculate how many missing?)

const GameBoard = () => {
    const [tileBoard, setTileBoard] = useState(EXAMPLE_BOARD);
    const [clues, setClues] = useState(EXAMPLE_CLUES);
    const [selectedTile, setSelectedTile] = useState({ x: null, y: null });
    const [highlightedTiles, setHighlightedTiles] = useState([]);
    const [direction, setDirection] = useState(DEFAULT_DIRECTION);
    const [timestamp, setTimestamp] = useState(Date.now());
    const [selectedClue, setSelectedClue] = useState(null);

    const handleListItemClick = (clueTile, id, direction) => {
        const tile = { x: clueTile.x, y: clueTile.y }
        setSelectedClue(id);
        setSelectedTile(tile);
        setDirection(direction);
        setHighlightedTiles(highlightTiles(tile, direction));
    };

    useEffect(() => {
        let clueNumber = 1;
        const cluesWithTileRef = {
            HORIZONTAL: [],
            VERTICAL: []
        }

        if(!clues.HORIZONTAL || !clues.VERTICAL) {
            return;
        }

        const newTileBoard = tileBoard;
        tileBoard.forEach((row, y) => {
            row.forEach((t, x) => {
                if(t.blank || (isTile(x, y - 1) && isTile(x - 1, y))) {
                    return;
                }
                const tile = {x, y}
                newTileBoard[y][x].clueNumber = clueNumber;

                if(!isTile(x, y - 1)) {
                    const vClue = clues.VERTICAL[cluesWithTileRef.VERTICAL.length];
                    vClue.tile = tile;
                    vClue.id = clueId(VERTICAL, clueNumber);
                    vClue.clueNumber = clueNumber;
                    cluesWithTileRef.VERTICAL.push(vClue)
                    const tilesInAnswer = highlightTiles(tile, VERTICAL)
                    tilesInAnswer.forEach(({x, y}) => newTileBoard[y][x].clueNumberLink = { ...newTileBoard[y][x].clueNumberLink, VERTICAL: clueId(VERTICAL, clueNumber) });
                }

                if(!isTile(x - 1, y)) {
                    const hClue = clues.HORIZONTAL[cluesWithTileRef.HORIZONTAL.length];
                    hClue.tile = tile;
                    hClue.id = clueId(HORIZONTAL, clueNumber);
                    hClue.clueNumber = clueNumber;
                    cluesWithTileRef.HORIZONTAL.push(hClue)
                    const tilesInAnswer = highlightTiles(tile, HORIZONTAL)
                    console.log(tilesInAnswer);
                    console.log(clueNumber);
                    tilesInAnswer.forEach(({x, y}) => newTileBoard[y][x].clueNumberLink = { ...newTileBoard[y][x].clueNumberLink, HORIZONTAL: clueId(HORIZONTAL, clueNumber) });
                }
                clueNumber++;
            })
        });
        setClues(cluesWithTileRef);
        setTileBoard(newTileBoard);
    }, []);

    const classes = useStyles();

    const arrowKeyPress = key => {
        if(HORIZONTAL_ARROW_KEYS.includes(key)) {
            if(direction !== HORIZONTAL) {
                setDirection(HORIZONTAL);
                setHighlightedTiles(highlightTiles(selectedTile, HORIZONTAL))
                setSelectedClue(tileBoard[selectedTile.y][selectedTile.x].clueNumberLink.HORIZONTAL)
            } else {
                if(key === ARROW_RIGHT) {
                    const { x, y } = { x: selectedTile.x + 1, y: selectedTile.y};
                    if(isTile(x, y)) {
                        setSelectedTile({ x , y });
                        setSelectedClue(tileBoard[y][x].clueNumberLink.HORIZONTAL)
                    }
                }
                if(key === ARROW_LEFT) {
                    const { x, y } = { x: selectedTile.x - 1, y: selectedTile.y};
                    if(isTile(x, y)) {
                        setSelectedTile({ x , y });
                        setSelectedClue(tileBoard[y][x].clueNumberLink.HORIZONTAL)
                    }
                }
            }
        }
        if(VERTICAL_ARROW_KEYS.includes(key)) {
            if(direction !== VERTICAL) {
                setDirection(VERTICAL);
                setHighlightedTiles(highlightTiles(selectedTile, VERTICAL))
                setSelectedClue(tileBoard[selectedTile.y][selectedTile.x].clueNumberLink.VERTICAL)
            } else {
                if(key === ARROW_UP) {
                    const { x, y } = { x: selectedTile.x, y: selectedTile.y - 1};
                    if(isTile(x, y)) {
                        setSelectedTile({ x , y });
                        setSelectedClue(tileBoard[y][x].clueNumberLink.VERTICAL)
                    }
                }
                if(key === ARROW_DOWN) {
                    const { x, y } = { x: selectedTile.x, y: selectedTile.y + 1};
                    if(isTile(x, y)) {
                        setSelectedTile({ x , y });
                        setSelectedClue(tileBoard[y][x].clueNumberLink.VERTICAL)
                    }
                }
            }
        }
    }

    const letterKeyPres = key => {
        const {x, y} = selectedTile;
        if(x === null || y === null) {
            return;
        }

        const newTileBoard = tileBoard;
        newTileBoard[y][x].guess = key.toUpperCase();
        setTileBoard(newTileBoard);
        if(direction === HORIZONTAL && isTile(x + 1, y)) {
            setSelectedTile({ x: x + 1, y })
        } else if(direction === VERTICAL && isTile(x, y + 1)) {
            setSelectedTile({ x, y: y + 1 })
        } else {
            setTimestamp(Date.now()); // force rerender
        }
    }

    const deleteLetter = () => {
        const newTileBoard = tileBoard;
        newTileBoard[selectedTile.y][selectedTile.x].guess = '';
        setTileBoard(newTileBoard);
        setTimestamp(Date.now()); // force rerender
    }

    useKeypress([
        ...VERTICAL_ARROW_KEYS,
        ...HORIZONTAL_ARROW_KEYS,
        ...ALPHABET,
        ...ALPHABET_LOWER,
        ...DELETE_KEYS
    ], ({ key }) => {
        if([...VERTICAL_ARROW_KEYS, ...HORIZONTAL_ARROW_KEYS].includes(key)) {
            arrowKeyPress(key);
        }
        if(key.length === 1 && key.match(/[a-z\s]/i)) {
            letterKeyPres(key);
        }
        if(DELETE_KEYS.includes(key)) {
            deleteLetter();
        }
    });

    const gameBoardSize = tileBoard.length * TILE_SIZE;


    const isTile = (x, y) => {
        const isLocationOnBoard = (x, y) => x >= 0 && y >= 0 && x < tileBoard.length && y < tileBoard.length;
        if(!isLocationOnBoard(x, y)) {
            return false;
        }
        return !tileBoard[y][x].blank;
    }

    const highlightTiles = (selected, d = direction) => {
        const highlightedTiles = [];

        for(let {x, y} = selected; isTile(x, y); d === VERTICAL ? y++ : x++) {
            highlightedTiles.push({ x, y });
        }
        for(let {x, y} = selected; isTile(x, y); d === VERTICAL ? y-- : x--) {
            highlightedTiles.push({ x, y });
        }

        return highlightedTiles;
    }

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
                        setHighlightedTiles(highlightTiles(tile))
                    }}
                /> : <Block {...tile} />
        )
    }

    const clueId = (direction, i) => `${direction}${i}`;

    const clueRowWithDirection = direction => ({ index: i, style }) => {
        const clue = clues[direction][i];
        const selected = selectedClue === clue.id;
        return (
            <ListItem
                style={{
                    ...style,
                    ...(selected ? { backgroundColor: '#0ff' } : {}),
                }}
                key={clue.id}
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

    return (
        <div className={classes.root}>
            <Grid container spacing={3}>
                <Grid item xs={6} >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${gameBoardSize} ${gameBoardSize}`} >
                        <g>
                            {tileBoard.map((row, y) =>
                                row.map((tile, x) => placeTile(tile, x, y))
                            )}
                        </g>
                        <g>
                            <path d={grid(tileBoard.length)} stroke="dimgray" vectorEffect="non-scaling-stroke" />
                        </g>
                    </svg>
                </Grid>
                <Grid item xs={3}>
                    Across
                    <FixedSizeList height={400} itemSize={46} itemCount={clues.HORIZONTAL.length}>
                        {clueRowWithDirection(HORIZONTAL)}
                    </FixedSizeList>
                </Grid>
                <Grid item xs={3}>
                    Down
                    <FixedSizeList height={400} itemSize={46} itemCount={clues.VERTICAL.length}>
                        {clueRowWithDirection(VERTICAL)}
                    </FixedSizeList>
                </Grid>
            </Grid>
        </div>
    )
}

export default GameBoard;
