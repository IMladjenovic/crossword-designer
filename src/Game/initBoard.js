import cloneDeep from "lodash/cloneDeep";
import {directionFromClueId, indexFromClueId, getOppositeDirection, prepTileConfig} from "./utils";
import {DEFAULT_DIRECTION, HORIZONTAL} from "./constants";
import min from "lodash/min";

const clueId = (direction, i) => `${direction}${i}`;

export const emptyTile = () => ({ answer: '', guess: '' });
export const block = () => ({ blank: 'yes' });
export const emptyClue = () => ({ clue: '' });

export const initDesignBoard = (data, newTilesAtStart = false) => {
    const board = data.board.map(row => row.map(cell => cell.blank ? cell : { guess: cell.guess, answer: cell.answer }));
    const clueList = cloneDeep(data.clues);
    const gameFinishedMessage = data.gameFinishedMessage;

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

    if(!data.clues.HORIZONTAL || !data.clues.VERTICAL) {
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
                const clue = clueList[DIRECTION].length > 0 ? clueList[DIRECTION].shift() : emptyClue();

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

    const isTileOnNewBoard = tile => {
        return isTile(tile) && !!getTileBoardItem(tile).clueNumberLink[direction];
    }

    const isTileOnOldBoard = tile => {
        return data.isTile(tile) && !!data.getTileBoardItem(tile).clueNumberLink[direction];
    }

    const lookupClueOnOldBoard = (clue, DIRECTION, NEXT_TILE, NEW_BOARD_ADJUSTER) => {
        for(let i = 0; i < 2; i++) {
            const tile = NEXT_TILE(clue.tile, i);
            if(isTileOnNewBoard(NEW_BOARD_ADJUSTER(tile)) && isTileOnOldBoard(tile)) { // who are we attaching links to
                return getTileBoardItem(NEW_BOARD_ADJUSTER(tile)).clueNumberLink[DIRECTION];
            }
        }
        return null;
    }

    const copyClueLinksAcross = ({ DIRECTION, NEXT_TILE }) => {
        const adjustment = newTilesAtStart ? board.length - data.board.length : 0; // account for board shifting with new tiles
        const NEW_BOARD_ADJUSTER = ({ x, y }) => ({ x: x + adjustment, y: y + adjustment});
        data.clues[DIRECTION].forEach(clue => {
            if(clue.linkClues.length > 0) {
                const newClueId = lookupClueOnOldBoard(clue, DIRECTION, NEXT_TILE, NEW_BOARD_ADJUSTER); // who are we attaching links to
                if(newClueId) {
                    const newClueLinks = clue.links.map(oldLinkId => {
                        const oldLink = data.clues[DIRECTION][indexFromClueId(oldLinkId)];
                        return lookupClueOnOldBoard(oldLink, DIRECTION, NEXT_TILE, NEW_BOARD_ADJUSTER);
                    })
                    clues[DIRECTION][indexFromClueId(newClueId)].linkClues.push(newClueLinks)
                }
            }
        })
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

    copyClueLinksAcross(prepTileConfig.HORIZONTAL);
    copyClueLinksAcross(prepTileConfig.VERTICAL);

    const selectedTile = isTile(data.selectedTile) ? data.selectedTile : clues[DEFAULT_DIRECTION][0].tile;
    const direction =
        isTile(data.selectedTile) ? // is selected tile a block now?
            getTileBoardItem(data.selectedTile).clueNumberLink[data.direction] ? // does selected tile still have this direciton?
                data.direction : getOppositeDirection(data.direction)
        : DEFAULT_DIRECTION;

    const game = {
        board,
        title: data.title,
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
        gameBoardSize: min([window.screen.height, window.screen.width, 500]),
        tileSize: min([window.screen.height, window.screen.width, 500])/data.board.length,
        getClue: clueId => clues[directionFromClueId(clueId)][indexFromClueId(clueId)],
        getClueIdFromTile: (tile, direction) => game.getTileBoardItem(tile ? tile : game.selectedTile).clueNumberLink[direction ? direction: game.direction],
        getSecondaryClueIdFromTile: (tile, direction) => game.getTileBoardItem(tile ? tile : game.selectedTile).clueNumberLink[getOppositeDirection(direction ? direction: game.direction)]
    }
    // game.getClue = clueId => {
    //     return game.clues[directionFromClueId(clueId)][indexFromClueId(clueId)];
    // }
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
