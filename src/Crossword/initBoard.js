import cloneDeep from "lodash/cloneDeep";
import {directionFromClueId, indexFromClueId, getOppositeDirection, prepTileConfig} from "./utils";
import {HORIZONTAL, VERTICAL} from "./constants";
import min from "lodash/min";
import compact from "lodash/compact";

const clueId = (direction, i) => `${direction}${i}`;

export const emptyTile = () => ({ answer: '', guess: '' });
export const block = () => ({ blank: 'yes' });
export const emptyClue = () => ({ clue: '' });

export const ADD_TO_START = 'ADD_TO_START';
export const ADD_TO_END = 'ADD_TO_END';
export const DELETE_START = 'DELETE_START';
export const DELETE_END = 'DELETE_END';

export const modifyBoardLengthConfig = {
    ADD_TO_START: {
        method: (array, value) => array.unshift(value),
        adjust: ({ x, y }) => ({ x: x + 1, y: y + 1 })
    },
    ADD_TO_END: {
        method: (array, value) => array.push(value),
        adjust: tile => tile
    },
    DELETE_START: {
        method: array => array.shift(),
        adjust: ({ x, y }) => ({ x: x - 1, y: y - 1 })
    },
    DELETE_END: {
        method: array => array.pop(),
        adjust: tile => tile
    }
}

const isStartModification = modificationType => modificationType === ADD_TO_START || modificationType === ADD_TO_END;

const modifyBoardLength = (game, modificationType) => {
    const gameC = cloneDeep(game);
    const { method } = modifyBoardLengthConfig[modificationType];
    let newRow;
    if(isStartModification(modificationType)) {
        const newArrayLength = game.board.length + 1;
        newRow = new Array(newArrayLength);
        for (let i = 0; i < newArrayLength; i++) { // faster than .forEach or .fill().map(...)
            newRow[i] = emptyTile();
        }
    }
    gameC.board.forEach(row => method(row, emptyTile()));
    method(gameC.board, newRow);
    return gameC;
}

const addBoardFunctions = game => {
    const getTileBoardItem = ({x , y}) => game.board[y][x];
    const _isLocationOnBoard = ({ x, y }) => isLocationOnBoard(x, y);
    const isLocationOnBoard = (x, y) => x >= 0 && y >= 0 && x < game.board.length && y < game.board.length;
    const isTile = ({ x, y }) => isTileAtCoords(x, y);
    const isTileAtCoords = (x, y) => {
        if(!isLocationOnBoard(x, y)) {
            return false;
        }
        return !getTileBoardItem({ x, y}).blank;
    }
    game.getTileBoardItem = getTileBoardItem;
    game._isLocationOnBoard = _isLocationOnBoard;
    game.isLocationOnBoard = isLocationOnBoard;
    game.isTile = isTile;
    game.isTileAtCoords = isTileAtCoords;
}

export const initDesignBoard = (oldGame, modificationType = '') => {
    addBoardFunctions(oldGame);
    const modifyBoard = modificationType ? game => modifyBoardLength(game, modificationType) : game => game;
    const board = modifyBoard(oldGame).board.map(row => row.map(cell => cell.blank ? cell : { guess: cell.guess, answer: cell.answer, circle: cell.circle }));
    const gameFinishedMessage = oldGame.gameFinishedMessage;

    const NEW_BOARD_ADJUSTER = modificationType ? modifyBoardLengthConfig[modificationType].adjust : tile => tile;

    const getTileBoardItem = ({x , y}) => board[y][x];
    const _isLocationOnBoard = ({ x, y }) => isLocationOnBoard(x, y);
    const isLocationOnBoard = (x, y) => x >= 0 && y >= 0 && x < board.length && y < board.length;
    const isTile = ({ x, y }) => isTileAtCoords(x, y);
    const isTileAtCoords = (x, y) => {
        if(!isLocationOnBoard(x, y)) {
            return false;
        }
        return !getTileBoardItem({ x, y}).blank;
    }

    let clueNumber = 0;
    const clues = {
        HORIZONTAL: [],
        VERTICAL: []
    }

    let totalNumberOfBoardLetters = 0;

    if(!oldGame.clues.HORIZONTAL || !oldGame.clues.VERTICAL) {
        console.log('Weird Error')
        return;
    }

    const updateClueNumber = (newClueNumber, board, tile) => {
        if(clueNumber !== newClueNumber) {
            return;
        }
        clueNumber++;
        board[tile.y][tile.x].clueNumber = clueNumber;
    }

    const prepareTile = ({ DIRECTION, NEXT_TILE, PREV_TILE }, tile, newClueNumber) => {
        const prevTileCoords = PREV_TILE(tile);
        const isNextTile = isTile(NEXT_TILE(tile));

        if(!isTile(prevTileCoords)) { // is previous tile block?
            if(isNextTile) { // is not single wide tile
                updateClueNumber(newClueNumber, board, tile);
                const clue = emptyClue();

                clue.tile = tile;
                clue.id = clueId(DIRECTION, clues[DIRECTION].length);
                clue.clueNumber = clueNumber;
                clue.linkClues = [];

                board[tile.y][tile.x].clueNumberLink[DIRECTION] = clue.id;
                clues[DIRECTION].push(clue);
            }
        } else {
            const prevTile = board[prevTileCoords.y][prevTileCoords.x];
            board[tile.y][tile.x].clueNumberLink[DIRECTION] = prevTile.clueNumberLink[DIRECTION];
            if(!isNextTile) {
                clues[DIRECTION].find(clue => clue.id === prevTile.clueNumberLink[DIRECTION]).endTile = tile;
            }
        }
    }

    board.forEach((row, y) => {
        row.forEach((t, x) => {
            const newClueNumber = clueNumber;
            if(t.blank) {
                return;
            }

            totalNumberOfBoardLetters++;

            const tile = {x, y}
            board[y][x].clueNumberLink = {};

            prepareTile(prepTileConfig.HORIZONTAL, tile, newClueNumber);
            prepareTile(prepTileConfig.VERTICAL, tile, newClueNumber);
        })
    });

    const isTileOnNewBoard = (tile, direction) => {
        return isTile(tile) && !!getTileBoardItem(tile).clueNumberLink[direction];
    }

    const isTileOnOldBoard = (tile, direction) => {
        return oldGame.isTile(tile) && oldGame.getTileBoardItem(tile).clueNumberLink && !!oldGame.getTileBoardItem(tile).clueNumberLink[direction];
    }

    const lookupClueOnNewBoard = (clue, { DIRECTION, NEXT_TILE }) => {
        for(let i = 0; i <= 2; i++) {
            const tile = NEXT_TILE(clue.tile, i);
            if(isTileOnNewBoard(NEW_BOARD_ADJUSTER(tile), DIRECTION) && isTileOnOldBoard(tile, DIRECTION)) { // who are we attaching links to
                return getTileBoardItem(NEW_BOARD_ADJUSTER(tile)).clueNumberLink[DIRECTION];
            }
        }
        return null;
    }

    oldGame.clues[HORIZONTAL].concat(oldGame.clues[VERTICAL]).forEach(clue => {
        const direction = directionFromClueId(clue.id);
        if(clue.linkClues.length > 0 || clue.clue) {
            const newClueId = lookupClueOnNewBoard(clue, prepTileConfig[direction]); // who are we attaching links to
            if(newClueId) {
                const newClueLinks = compact(clue.linkClues.map(oldLinkId => {
                    const linkDirection = directionFromClueId(oldLinkId);
                    const oldLink = oldGame.clues[linkDirection][indexFromClueId(oldLinkId)]; // TODO what direction is the old link going in?
                    return lookupClueOnNewBoard(oldLink, prepTileConfig[linkDirection]);
                }));
                clues[direction][indexFromClueId(newClueId)].linkClues.push(...newClueLinks);
                clues[direction][indexFromClueId(newClueId)].clue = clue.clue;
            }
        }
    })

    const newTile = NEW_BOARD_ADJUSTER(oldGame.selectedTile);
    const nearestSelectedClueId = lookupClueOnNewBoard({ tile: oldGame.selectedTile }, prepTileConfig[oldGame.direction]);
    const direction = oldGame.direction;
    const selectedTile = nearestSelectedClueId ?
        nearestSelectedClueId === getTileBoardItem(newTile).clueNumberLink[direction] ?
            newTile : clues[directionFromClueId(nearestSelectedClueId)][indexFromClueId(nearestSelectedClueId)].tile
        : clues[direction][0].tile;

    const gameBoardSize =  min([window.screen.height, window.screen.width, 500]);

    const game = {
        board,
        title: oldGame.title,
        clues,
        selectedTile,
        direction,
        customGlyphs: [],
        totalNumberOfBoardLetters,
        _isLocationOnBoard,
        isLocationOnBoard,
        isTile,
        isTileAtCoords,
        getTileBoardItem,
        gameFinishedMessage,
        previousKeyWasDelete: false,
        gameBoardSize,
        tileSize: gameBoardSize/board.length,
        getClue: clueId => clues[directionFromClueId(clueId)][indexFromClueId(clueId)],
        getClueIdFromTile: (tile, direction) => game.getTileBoardItem(tile ? tile : game.selectedTile).clueNumberLink[direction ? direction: game.direction],
        getSecondaryClueIdFromTile: (tile, direction) => game.getTileBoardItem(tile ? tile : game.selectedTile).clueNumberLink[getOppositeDirection(direction ? direction: game.direction)]
    }
    return game;
}

export const emptyDesignBoard = initDesignBoard({
    board: [
        [emptyTile(), emptyTile(), emptyTile(), emptyTile(), emptyTile(), emptyTile(), emptyTile(), emptyTile(), emptyTile(), emptyTile(), emptyTile(), emptyTile(), emptyTile()],
        [emptyTile(), emptyTile(), emptyTile(), emptyTile(), emptyTile(), emptyTile(), emptyTile(), emptyTile(), emptyTile(), emptyTile(), emptyTile(), emptyTile(), emptyTile()],
        [emptyTile(), emptyTile(), emptyTile(), emptyTile(), emptyTile(), emptyTile(), emptyTile(), emptyTile(), emptyTile(), emptyTile(), emptyTile(), emptyTile(), emptyTile()],
        [emptyTile(), emptyTile(), emptyTile(), emptyTile(), emptyTile(), emptyTile(), emptyTile(), emptyTile(), emptyTile(), emptyTile(), emptyTile(), emptyTile(), emptyTile()],
        [emptyTile(), emptyTile(), emptyTile(), emptyTile(), emptyTile(), emptyTile(), emptyTile(), emptyTile(), emptyTile(), emptyTile(), emptyTile(), emptyTile(), emptyTile()],
        [emptyTile(), emptyTile(), emptyTile(), emptyTile(), emptyTile(), emptyTile(), emptyTile(), emptyTile(), emptyTile(), emptyTile(), emptyTile(), emptyTile(), emptyTile()],
        [emptyTile(), emptyTile(), emptyTile(), emptyTile(), emptyTile(), emptyTile(), emptyTile(), emptyTile(), emptyTile(), emptyTile(), emptyTile(), emptyTile(), emptyTile()],
        [emptyTile(), emptyTile(), emptyTile(), emptyTile(), emptyTile(), emptyTile(), emptyTile(), emptyTile(), emptyTile(), emptyTile(), emptyTile(), emptyTile(), emptyTile()],
        [emptyTile(), emptyTile(), emptyTile(), emptyTile(), emptyTile(), emptyTile(), emptyTile(), emptyTile(), emptyTile(), emptyTile(), emptyTile(), emptyTile(), emptyTile()],
        [emptyTile(), emptyTile(), emptyTile(), emptyTile(), emptyTile(), emptyTile(), emptyTile(), emptyTile(), emptyTile(), emptyTile(), emptyTile(), emptyTile(), emptyTile()],
        [emptyTile(), emptyTile(), emptyTile(), emptyTile(), emptyTile(), emptyTile(), emptyTile(), emptyTile(), emptyTile(), emptyTile(), emptyTile(), emptyTile(), emptyTile()],
        [emptyTile(), emptyTile(), emptyTile(), emptyTile(), emptyTile(), emptyTile(), emptyTile(), emptyTile(), emptyTile(), emptyTile(), emptyTile(), emptyTile(), emptyTile()],
        [emptyTile(), emptyTile(), emptyTile(), emptyTile(), emptyTile(), emptyTile(), emptyTile(), emptyTile(), emptyTile(), emptyTile(), emptyTile(), emptyTile(), emptyTile()]
    ],
    clues: {
        HORIZONTAL: [
        ],
        VERTICAL: [
        ]
    },
    title: 'Name your crossword',
    gameFinishedMessage: 'you win',
    selectedTile: { x: 0, y: 0 },
    direction: HORIZONTAL
});
