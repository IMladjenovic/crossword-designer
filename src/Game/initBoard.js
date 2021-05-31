import cloneDeep from "lodash/cloneDeep";
import {getOppositeDirection, prepTileConfig} from "./utils";
import {DEFAULT_DIRECTION, HORIZONTAL, VERTICAL} from "./constants";
import min from "lodash/min";

const clueId = (direction, i) => `${direction}${i}`;

export const emptyTile = () => ({ answer: '' });
export const block = () => ({ blank: 'yes' });
export const emptyClue = () => ({ clue: '' });

export const initDesignBoard = data => {
    const board = data.board.map(row => row.map(cell => cell.blank ? cell : { guess: cell.guess }));
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
                clue.id = clueId(DIRECTION, clueNumber);
                clue.clueNumber = clueNumber;

                board[tile.y][tile.x].clueNumberLink[DIRECTION] = clueId(DIRECTION, clueNumber);
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

            prepareTile(prepTileConfig.HORIZONTAL, tile, newClueNumber)
            prepareTile(prepTileConfig.VERTICAL, tile, newClueNumber)
        })
    });

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
        getTileClue: (tile, direction) => game.getTileBoardItem(tile ? tile : game.selectedTile).clueNumberLink[direction ? direction: game.direction],
        getSecondaryTileClue: (tile, direction) => game.getTileBoardItem(tile ? tile : game.selectedTile).clueNumberLink[getOppositeDirection(direction ? direction: game.direction)]
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
