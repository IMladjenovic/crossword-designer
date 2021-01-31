import React, { useState } from 'react'
import useKeypress from 'react-use-keypress'

import './index.css';

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
import EXAMPLE_BOARD from "./tileBoard";

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
            <text x={x + (TILE_SIZE / 2)} y={y + TILE_SIZE}>{tileContent.guess}</text>
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
    const [tileBoard, setTileBoard] = useState(EXAMPLE_BOARD);
    const [selectedTile, setSelectedTile] = useState({ x: null, y: null });
    const [highlightedTiles, setHighlightedTiles] = useState([]);
    const [direction, setDirection] = useState(DEFAULT_DIRECTION);
    const [timestamp, setTimestamp] = useState(Date.now());

    const arrowKeyPress = key => {
        if(HORIZONTAL_ARROW_KEYS.includes(key)) {
            if(direction !== HORIZONTAL) {
                setDirection(HORIZONTAL);
                setHighlightedTiles(highlightTiles(selectedTile, HORIZONTAL))
            } else {
                if(key === ARROW_RIGHT) {
                    const { x, y } = { x: selectedTile.x + 1, y: selectedTile.y};
                    if(tileIsNotBlank(x, y)) {
                        setSelectedTile({ x , y });
                    }
                }
                if(key === ARROW_LEFT) {
                    const { x, y } = { x: selectedTile.x - 1, y: selectedTile.y};
                    if(tileIsNotBlank(x, y)) {
                        setSelectedTile({ x , y });
                    }
                }
            }
        }
        if(VERTICAL_ARROW_KEYS.includes(key)) {
            if(direction !== VERTICAL) {
                setDirection(VERTICAL);
                setHighlightedTiles(highlightTiles(selectedTile, VERTICAL))
            } else {
                if(key === ARROW_UP) {
                    const { x, y } = { x: selectedTile.x, y: selectedTile.y - 1};
                    if(tileIsNotBlank(x, y)) {
                        setSelectedTile({ x , y });
                    }
                }
                if(key === ARROW_DOWN) {
                    const { x, y } = { x: selectedTile.x, y: selectedTile.y + 1};
                    if(tileIsNotBlank(x, y)) {
                        setSelectedTile({ x , y });
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
        newTileBoard[x][y].guess = key.toUpperCase();
        setTileBoard(newTileBoard);
        if(direction === HORIZONTAL && tileIsNotBlank(x + 1, y)) {
                setSelectedTile({ x: x + 1, y })
        } else if(direction === VERTICAL && tileIsNotBlank(x, y + 1)) {
                setSelectedTile({ x, y: y + 1 })
        } else {
            setTimestamp(Date.now()); // force rerender
        }
    }

    const deleteLetter = () => {
        const newTileBoard = tileBoard;
        newTileBoard[selectedTile.x][selectedTile.y].guess = '';
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

    const isLocationOnBoard = (x, y) => x >= 0 && y >= 0 && x < tileBoard.length&& y < tileBoard.length;

    const tileIsNotBlank = (x, y) => {
        if(!isLocationOnBoard(x, y)) {
            return false;
        }
        return !tileBoard[x][y].blank;
    }

    const highlightTiles = (selected, d = direction) => {
        const highlightedTiles = [];

        for(let {x, y} = selected; tileIsNotBlank(x, y); d === VERTICAL ? y++ : x++) {
            highlightedTiles.push({ x, y });
        }
        for(let {x, y} = selected; tileIsNotBlank(x, y); d === VERTICAL ? y-- : x--) {
            highlightedTiles.push({ x, y });
        }

        return highlightedTiles;
    }

    const placeTile = (tileContent, x, y) => {
        const tile = {
            key: `${x}${y}`,
            tileContent,
            y,
            x
        };

        return (
            tileContent.answer ? <Tile
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

    return (
        <div>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${gameBoardSize} ${gameBoardSize}`} >
                <g>
                    {tileBoard.map((row, x) =>
                        row.map((tile, y) => placeTile(tile, x, y))
                    )}
                </g>
                <g>
                    <path d={grid(tileBoard.length)} stroke="dimgray" vectorEffect="non-scaling-stroke" />
                </g>
            </svg>
        </div>
    )
}

export default GameBoard;
