import React, { useState } from 'react'

import './index.css';

const TILE_SIZE = 33;
const DEFAULT_DIRECTION = 'down';

const grid = nTiles => {
    let grid = '';
    const lineLength = nTiles * TILE_SIZE;
    for(let i = 0; i < nTiles; i++) {
        grid = `${grid} M0.00,${i * TILE_SIZE} l${lineLength},0.00 M${i * TILE_SIZE},0.00 l0.00,${lineLength} `;
    }
    return grid;
}


const Cell = ({ tileContent, x, y, className, ...other }) => {
    return (
        <g>
            <rect
                x={x * TILE_SIZE}
                y={y * TILE_SIZE}
                height={TILE_SIZE}
                width={TILE_SIZE}
                className={className}
                {...other}
            />
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

const GameBoard = ({ tileBoard }) => {
    const [selectedTile, setSelectedTile] = useState({ x: null, y: null });
    const [highlightedTiles, setHighlightedTiles] = useState([]);
    const [direction, setDirection] = useState(DEFAULT_DIRECTION);

    const gameBoardSize = tileBoard.length * TILE_SIZE;

    const upwardsTileIsCell = (x, y) => {
        if(x < 0 || y < 0 || x > tileBoard.length - 1 || y > tileBoard.length - 1) {
            return false;
        }
        return !tileBoard[x][y].blank;
    }

    const highlightTiles = (selected) => {
        const highlightedTiles = [];

        for(let {x, y} = selected; upwardsTileIsCell(x, y); y++) {
            console.log({ x, y })
            highlightedTiles.push({ x, y });
        }
        for(let {x, y} = selected; upwardsTileIsCell(x, y); y--) {
            console.log({ x, y })
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
                        console.log(highlightedTiles)
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
