import React, { useState, useEffect, useRef } from 'react'
import useKeypress from 'react-use-keypress'

import './index.css';
import { makeStyles } from '@material-ui/core/styles';
import { getOppositeDirection } from "./utils";
import { arrowKeyPress, clearLetterKey, letterKeyPres,tabKeyPress } from "./handleInput";

import intersection from 'lodash/intersection';

import { fonts } from 'js-pixel-fonts';

import {
    ALPHABET,
    ALPHABET_LOWER,
    ALL_DIRECTIONAL_KEYS,
    HORIZONTAL_ARROW_KEYS,
    VERTICAL_ARROW_KEYS,
    CLEAR_LETTER_KEYS,
    TAB
} from './constants'

const useStyles = makeStyles(() => ({ root: { flexGrow: 1 }}));
const useCrosswordStyles = makeStyles(() => ({
    block: { fill: '#e8a87c' },
    tile: { fill: 'none', stroke: 'none', pointerEvents: 'visible' },
    gameBoardBackground: { zIndex: '-100', fill: '#fafafa', stroke: 'none' },
    finishMessagePixel: { fill: '#c38d9e' },
    selectedTile: { fill: '#c38d9e' },
    gameWon: { fill: '#85dcb0' },
    highlighted: { fill: '#85dcb0' },
    linkHighlighted: { fill: '#e8a87c', opacity: '50%' },
    selectedClue: { backgroundColor: '#85dcb0', },
    secondaryClue: { backgroundColor: '#85dcb0', opacity: '10%' },
    grid: { stroke: '#e27d60' },
    text: { cursor: 'default' },
    '*::-webkit-scrollbar': { width: '10px' },
    '*::-webkit-scrollbar-track': { background: '#f1f1f1' },
    '*::-webkit-scrollbar-thumb': { background: '#41b3ac' },
    '*::-webkit-scrollbar-thumb:hover': { background: '#555' }
}))

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
        classes,
        onClick,
        tileSize,
        onContextMenu,
        children,
        x, y
          }) => {
    return (
        <g>
            <rect
                x={x}
                y={y}
                height={tileSize}
                width={tileSize}
                className={classes}
                onClick={onClick}
                onContextMenu={onContextMenu}
            />
            {children}
        </g>
    )
}

const Tile = props => {
    const {x, y, tileSize, numberOfTiles, onContextMenu, onClick, tileContent, classes} = props;
    return (
        <Cell
            classes={classes}
            {...props}>
            {tileContent.circle && <circle cx={x + tileSize / 2} cy={y + tileSize / 2} r={(tileSize / 2) - 1.3} stroke="black" stroke-width="1" fill="none" />}
            {tileContent.circle && tileContent.clueNumber && <rect x={x} y={y} width={(tileSize / 6) * 2} height={tileSize / 3.3} />}
            <text x={x + 1} y={y + 1.7} fontSize={`${9.75 / numberOfTiles}em`} alignmentBaseline="hanging" style={{ letterSpacing: '-1px'}}
                  className='clueNumber' onContextMenu={onContextMenu} onClick={onClick}>{tileContent.clueNumber || ''}</text>
            <text x={x + (tileSize / 2)} y={y + (tileSize/7 * 6)} fontSize={`${27 / numberOfTiles}em`}
                  textAnchor="middle" className='guess' onContextMenu={onContextMenu} onClick={onClick}>{tileContent.guess}</text>
        </Cell>
    )
}

const Block = props => <Cell className={props.classes} {...props} />

const Crossword = ({
    game,
    rightClick = null,
    activateTile,
    gameWon,
    preTileClick = () => {},
    postKeyPress = () => {},
    preventCrosswordTyping = false
}) => {
    const boardRef = useRef();
    const classes = useStyles();
    const crosswordClasses = useCrosswordStyles();

    const [timestamp, setTimestamp] = useState(Date.now());

    const preventKeyPress = useRef(false);

    const loadGlyphs = () => {
        game.customGlyphs.forEach(glyph => {
            const key = Object.keys(glyph)[0];
            fonts.sevenPlus.glyphs[key] = glyph[key];
        })
    }

    useEffect(() => {
        loadGlyphs();
    }, []);


    useKeypress([
        ...VERTICAL_ARROW_KEYS,
        ...HORIZONTAL_ARROW_KEYS,
        ...ALPHABET,
        ...ALPHABET_LOWER,
        ...CLEAR_LETTER_KEYS,
        TAB
    ], ({ key, shiftKey, repeat }) => {
        if(preventKeyPress.current || gameWon || preventCrosswordTyping) {
            return;
        }
        if(repeat) {
            preventKeyPress.current = true;
            setTimeout(() => preventKeyPress.current = false, 1);
        }
        setTimeout(() => {
            if ([...ALL_DIRECTIONAL_KEYS].includes(key)) {
                arrowKeyPress(key, game, activateTile);
                game.previousKeyWasDelete = false;
                return;
            }
            if (key.length === 1 && key.match(/[a-z]/i)) {
                letterKeyPres(key, game, activateTile, setTimestamp);
                postKeyPress();
                game.previousKeyWasDelete = false;
                return;
            }
            if (CLEAR_LETTER_KEYS.includes(key)) {
                clearLetterKey(key, game, activateTile, setTimestamp);
                return;
            }
            if (TAB === key) {
                tabKeyPress(shiftKey, game, activateTile);
            }
        }, 0);
    });

    const placeTile = (tileContent, x, y) => {
        const tile = { x, y };
        const tileProps = {
            key: `${x}${y}`,
            tileContent,
            y: y * game.tileSize,
            x: x * game.tileSize,
            tileSize: game.tileSize,
            numberOfTiles: game.board.length
        };

        const handleTileClick = () => {
            preTileClick();
            let oppositeDirection = getOppositeDirection(game.direction);
            const updateDirection =
                // clicking on already selected tile should change direction
                (game.selectedTile.x === x && game.selectedTile.y === y && game.getClueIdFromTile(tile, oppositeDirection)) ||
                // moving to tile which does not have current direction should change direction
                !game.getClueIdFromTile(tile, game.direction) ?
                    oppositeDirection : game.direction;

            activateTile(tile, updateDirection)
        }

        const selectedClueId = game.getClueIdFromTile();

        let classes;
        if(gameWon) {
            classes = game.board[y][x].finishMessagePixel === 1 ? // using y/x because end message sequence does not use initBoard
                crosswordClasses.finishMessagePixel : crosswordClasses.gameWon;
        } else if(tileContent.blank) {
            classes = crosswordClasses.block;
        } else if(game.selectedTile.x === x && game.selectedTile.y === y) {
            classes = crosswordClasses.selectedTile;
        } else if (selectedClueId === tileContent.clueNumberLink[game.direction]) {
            classes = crosswordClasses.highlighted;
        } else if (intersection(game.getClue(selectedClueId).linkClues, Object.values(tileContent.clueNumberLink)).length > 0) {
            classes = crosswordClasses.linkHighlighted;
        }

        return (
            !tileContent.blank ?
                <Tile
                    {...tileProps}
                    classes={`${crosswordClasses.tile} ${classes}`}
                    onClick={handleTileClick}
                    onContextMenu={event => { rightClick ? rightClick(event, tile, game) : handleTileClick() }}
                /> : <Block
                    {...tileProps} classes={classes}
                    onContextMenu={event => rightClick ? rightClick(event, tile, game) : handleTileClick()}
                />
        )
    }

    return (
        <div className={classes.root} style={{ maxWidth: game.gameBoardSize, maxHeight: game.gameBoardSize }}>
            <div style={{ display: 'contents' }}>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox={`-1 -1 ${game.gameBoardSize + 2}
                    ${game.gameBoardSize + 2}`}
                    style={{ marginTop: '20px', float: 'middle', outline: 'none', userSelect: 'none' }}
                    tabIndex="0"
                    width='100%'
                    onContextMenu={event => { event.preventDefault() }}
                    ref={elem => boardRef.current = elem}
                >
                    <rect className={crosswordClasses.gameBoardBackground} x='-1' y='-1' width={game.gameBoardSize + 2} height={game.gameBoardSize + 2} />
                    <g>
                        {game.board.map((row, y) =>
                            row.map((tile, x) => placeTile(tile, x, y))
                        )}
                    </g>
                    <g>
                        <path d={grid(game.board.length, game.tileSize)} className="grid" vectorEffect="non-scaling-stroke" />
                    </g>
                </svg>
            </div>
        </div>
    )
}

export default Crossword;
