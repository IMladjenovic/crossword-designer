import React, { useState, useEffect, useRef } from 'react'
import useKeypress from 'react-use-keypress'

import './index.css';
import Grid from '@material-ui/core/Grid';
import Snackbar from '@material-ui/core/Snackbar';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';
import { makeStyles } from '@material-ui/core/styles';
import { getOppositeDirection } from "./utils";
import { arrowKeyPress, clearLetterKey, letterKeyPres,tabKeyPress } from "./handleInput";
import checkBoardAnswersCorrect from "./checkGuesses";

import throttle from 'lodash/throttle';
import min from 'lodash/min';

import { fonts } from 'js-pixel-fonts';

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
    CLUE_COLUMN_TITLE,
    TAB
} from './constants'

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

const Clue = ({ clue, handleClueClick, selected, secondary, setRef }) => {
    return <li
            style={{
                ...(selected ? { backgroundColor: '#85dcb0' } :
                    secondary ? { backgroundColor: '#85dcb0', opacity: '50%' } : {}),
                cursor: 'pointer',
                outline: 'none',
                display: 'flex',
                padding: '5px 10px 5px 1px'
            }}
            key={clue.id}
            id={clue.id}
            button // TODO is this needed?
            selected={selected}
            onClick={() => handleClueClick(clue.tile, clue.id)}
            ref={setRef}
            tabIndex='-1'>
        <span style={{ fontWeight: 'bold',
            textAlign: 'right',
            minWidth: '24px',
            width: '24px'
        }}>{clue.clueNumber}</span>
        <span style={{
            marginLeft: '10px'
        }}>{ clue.clue }</span>
    </li>
}

const Cell = ({
              tileContent,
              x: _x,
              y: _y,
              className,
              onClick,
              finishMessagePixel,
              tileSize,
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
            <text x={x + 3} y={y + 10} font-size='0.7em'  className='clueNumber' onClick={onClick}>{tileContent.clueNumber || ''}</text>
            <text x={x + 8} y={y + tileSize - 3} font-size='1.1em' className='guess' onClick={onClick}>{tileContent.guess}</text>
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

const GameBoard = ({ data, saveConfig }) => {
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
        gameFinishedMessage: data.gameFinishedMessage,
        gameBoardSize: min([window.screen.height, window.screen.width, 500]),
        tileSize: min([window.screen.height, window.screen.width, 500])/data.init.board.length,
        getTileClue: (tile, direction) => getTileBoardItem(tile ? tile : game.selectedTile).clueNumberLink[direction ? direction: game.direction],
        getSecondaryTileClue: (tile, direction) => getTileBoardItem(tile ? tile : game.selectedTile).clueNumberLink[getOppositeDirection(direction ? direction: game.direction)]
    }).current;
    const clueRefs = useRef([]).current;

    const themeClues = useRef({ HORIZONTAL: {}, VERTICAL: {}, tiles: [] });
    const [timestamp, setTimestamp] = useState(Date.now());
    const [gameWon, setGameWon] = useState(false);
    const [incorrectGuessNumberOpen, setIncorrectGuessNumberOpen] = useState(false);
    const throttledIncorrectGuessNumberOpen = useRef(throttle(() => setIncorrectGuessNumberOpen(true), 15000, { leading: true, trailing: false })).current;

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
    };

    const loadGlyphs = () => {
        data.customGlyphs.forEach(glyph => {
            const key = Object.keys(glyph)[0];
            fonts.sevenPlus.glyphs[key] = glyph[key];
        })
    }

    useEffect(() => {
        loadGlyphs();
        saveConfig.save = () => game.board;
    }, []);

    const classes = useStyles();

    useKeypress([
        ...VERTICAL_ARROW_KEYS,
        ...HORIZONTAL_ARROW_KEYS,
        ...ALPHABET,
        ...ALPHABET_LOWER,
        ...CLEAR_LETTER_KEYS,
        TAB
    ], ({ key, shiftKey }) => {
        if(preventKeyPress.current || gameWon) {
            return;
        }
        preventKeyPress.current = true;
        setTimeout(() => preventKeyPress.current = false, 1);
        if([...ALL_DIRECTIONAL_KEYS].includes(key)) {
            arrowKeyPress(key, game, activateTile);
            game.previousKeyWasDelete = false;
            return;
        }
        if(key.length === 1 && key.match(/[a-z]/i)) {
            letterKeyPres(key, game, activateTile, setTimestamp,
                () => checkBoardAnswersCorrect(game, gameWon, setGameWon, throttledIncorrectGuessNumberOpen, setTimestamp, preventKeyPress));
            game.previousKeyWasDelete = false;
            return;
        }
        if(CLEAR_LETTER_KEYS.includes(key)) {
            clearLetterKey(key, game, activateTile, setTimestamp);
            return;
        }
        if(TAB === key) {
            tabKeyPress(shiftKey, game, activateTile);
        }
    });

    const getTileHighlights = (tile, d) =>
        game.clues[d].find(clue => clue.id === game.getTileClue(tile, d)).highlights;

    const activateTile = (
        tile,
        direction,
        focusPrimary = true
    ) => {
        game.selectedTile = tile;

        if(direction) {
            let highlightTiles = [];
            if(themeClues.current[direction][game.getTileClue(tile, direction)]) {
                highlightTiles.push(...themeClues.current.tiles);
            }
            highlightTiles.push(...getTileHighlights(tile, direction));
            game.highlightedTiles = highlightTiles;

            const secondaryClueId = game.getTileClue(tile, getOppositeDirection(direction));
            if(secondaryClueId) {
                clueRefs[secondaryClueId].focus()
            }
            const primaryClueId = game.getTileClue(tile, direction);
            if(focusPrimary && primaryClueId) {
                clueRefs[primaryClueId].focus()
            }
        }
        setTimestamp(Date.now())
    }

    const placeTile = (tileContent, x, y) => {
        const tileProps = {
            key: `${x}${y}`,
            tileContent,
            y,
            x,
            finishMessagePixel: getTileBoardItem({ x, y }).finishMessagePixel === 1,
            tileSize: game.tileSize
        };

        const handleTileClick = () => {
            let oppositeDirection = getOppositeDirection(game.direction);
            if(
                // clicking on already selected tile should change direction
                (game.selectedTile.x ===  x && game.selectedTile.y === y && getTileBoardItem(tileProps).clueNumberLink[oppositeDirection]) ||
                // moving to tile which does not have current direction should change direction
                !getTileBoardItem(tileProps).clueNumberLink[game.direction]) {
                game.direction = oppositeDirection;
            }
            activateTile(tileProps, game.direction)
        }

        return (
            tileContent.answer ?
                <Tile
                    {...tileProps}
                    {...game.tilePositionConfig.current}
                    selected={game.selectedTile.x === x && game.selectedTile.y === y}
                    highlighted={!!game.highlightedTiles.find(hTile => hTile.x === x && hTile.y === y )}
                    onClick={handleTileClick}
                    onContextMenu={event => { event.preventDefault(); handleTileClick() }}
                /> : <Block {...tileProps} {...game.tilePositionConfig.current} onContextMenu={event => event.preventDefault()} />
        )
    }

    return (
        <div className={classes.root}>
            <Grid container direction="row" justify="center" spacing={0}>
                <Grid item xs={12} sm={6} className={gameWon ? 'gameWon' : ''} style={{ display: 'contents' }}>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox={`-1 -1 ${game.gameBoardSize + 2}
                        ${game.gameBoardSize + 2}`}
                        style={{ maxWidth: game.gameBoardSize, maxHeight: game.gameBoardSize, marginTop: '40px', float: 'middle', outline: 'none', userSelect: 'none' }}
                        tabIndex="0"
                        onContextMenu={event => { event.preventDefault() }}
                        >
                        <rect className='gameBoardBackground' x='-1' y='-1' width={game.gameBoardSize + 2} height={game.gameBoardSize + 2} />
                        <g>
                            {game.board.map((row, y) =>
                                row.map((tile, x) => placeTile(tile, x, y))
                            )}
                        </g>
                        <g>
                            <path d={grid(game.board.length, game.tileSize)} className="grid" vectorEffect="non-scaling-stroke" />
                        </g>
                    </svg>
                </Grid>
                <Grid container direction='row' item xs={12} sm={6}>
                    <Grid item xs={12} sm={6}>
                        <span style={{ fontSize: '1.5em', height: '40px', display: 'block' }}>{CLUE_COLUMN_TITLE[HORIZONTAL]}</span>
                        <ol style={{ height: `${game.gameBoardSize}px`, overflowY: 'scroll', margin: '0 10px 0 0', listStyle: 'none', paddingLeft: '10px' }}>
                            {game.clues[HORIZONTAL].map(clue => {
                                return <Clue
                                    clue={clue}
                                    handleClueClick={(id, tile) => handleClueClick(id, tile, HORIZONTAL)}
                                    selected={clue.id === game.getTileClue()}
                                    secondary={clue.id === game.getSecondaryTileClue()}
                                    setRef={elem => clueRefs[clue.id] = elem}
                                />
                            })}
                        </ol>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <span style={{ fontSize: '1.5em', height: '40px', display: 'block' }}>{CLUE_COLUMN_TITLE[VERTICAL]}</span>
                        <ol style={{ height: `${game.gameBoardSize}px`, overflowY: 'scroll', margin: '0 10px 0 0', listStyle: 'none', paddingLeft: '10px' }}>
                            {game.clues[VERTICAL].map(clue => {
                                return <Clue
                                    clue={clue}
                                    handleClueClick={(id, tile) => handleClueClick(id, tile, VERTICAL)}
                                    selected={clue.id === game.getTileClue()}
                                    secondary={clue.id === game.getSecondaryTileClue()}
                                    setRef={elem => clueRefs[clue.id] = elem}
                                />
                            })}
                        </ol>
                    </Grid>
                </Grid>
                <Snackbar
                    anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'center',
                    }}
                    open={incorrectGuessNumberOpen}
                    autoHideDuration={30 * 1000}
                    onClose={handleCloseIncorrectGuessNumber}
                    message="There are some incorrect squares"
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
