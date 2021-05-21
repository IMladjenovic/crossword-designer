import clone from "lodash/clone";
import { prepTileConfig } from "./utils";

// refactoring crossword initialisation

const normal = 4;
const wider = 5;
const letterAdjustments = {
    "I": 2.5,
    "G": wider,
    "H": wider,
    "N": wider,
    "M": 7,
    "W": 8,
    "R": wider,
    "U": wider,
    "O": wider,
    "Q": wider,
    "Y": wider,
    "C": wider
}
const letterAdjust = letter => {
    const letterAdjustAmount = letterAdjustments[letter];
    return letterAdjustAmount ? letterAdjustAmount : normal;
};

export const tilePositionConfig = data => ({
    clueNumberXOffset: data.clueNumberXOffset ? data.clueNumberXOffset : 1.3,
        clueNumberYOffset: (data.tileSize/3.9) + (data.clueNumberYOffset ? data.clueNumberYOffset : 0),
        clueNumberFontSize: data.clueNumberFontSize ? data.clueNumberFontSize : "0.65em",
        guessXOffsetFunc: letter => (data.tileSize / letterAdjust(letter)) + (data.guessXOffset ? data.guessXOffset : 0),
        guessYOffset:  (7 * (data.tileSize / 8)) + (data.guessYOffset ? data.guessYOffset : 0),
        guessFontSize: data.guessFontSize ? data.guessFontSize : "1.8em"
})

const clueId = (direction, i) => `${direction}${i}`;

export const initBoard = ({ crossword }) => {
    const clues = {};
    clues.HORIZONTAL = crossword.clues.ACROSS.map(clue => clue)
    clues.VERTICAL = crossword.clues.DOWN.map(clue => clue)

    const tileBoard = crossword.board.map(row => row.map(letter => {
        return letter !== " " ? { answer: letter, guess: "" } : { blank: "yes" };
    }));

    const themeClues = { HORIZONTAL: {}, VERTICAL: {}, tiles: [] };

    const getTileBoardItem = ({x , y}) => tileBoard[y][x];
    const _isLocationOnBoard = ({ x, y }) => isLocationOnBoard(x, y);
    const isLocationOnBoard = (x, y) => x >= 0 && y >= 0 && x < tileBoard.length && y < tileBoard.length;
    const isTile = ({ x, y }) => isTileAtCoords(x, y);
    const isTileAtCoords = (x, y) => {
        if(!isLocationOnBoard(x, y)) {
            return false;
        }
        return !getTileBoardItem({ x, y}).blank;
    }

    let clueNumber = 0;
    const cluesWithTileRef = {
        HORIZONTAL: [],
        VERTICAL: []
    }

    let totalNumberOfBoardLetters = 0;

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

    const prepareTile = ({ DIRECTION, NEXT_TILE, PREV_TILE }, tile, newClueNumber) => {
        const prevTileCoords = PREV_TILE(tile);

        if(!isTile(prevTileCoords)) {
            if(isTile(NEXT_TILE(tile))) {
                updateClueNumber(newClueNumber, newTileBoard, tile);
                const clue = clues[DIRECTION][cluesWithTileRef[DIRECTION].length];

                clue.tile = tile;
                clue.id = clueId(DIRECTION, clueNumber);
                clue.clueNumber = clueNumber;
                clue.highlights = [];
                if(clue.theme) {
                    themeClues[DIRECTION][clue.id] = true;
                    themeClues.tiles.push(tile);
                }

                clue.highlights.push(tile);
                newTileBoard[tile.y][tile.x].clueNumberLink[DIRECTION] = clueId(DIRECTION, clueNumber);
                cluesWithTileRef[DIRECTION].push(clue);
            }
        } else {
            const prevTile = newTileBoard[prevTileCoords.y][prevTileCoords.x];
            newTileBoard[tile.y][tile.x].clueNumberLink[DIRECTION] = prevTile.clueNumberLink[DIRECTION];
            if(prevTile.theme) {
                themeClues[DIRECTION][prevTile.id] = true;
                themeClues.tiles.push(tile);
            }
            const previousClueHighlightChain = cluesWithTileRef[DIRECTION].find(clue => clue.highlights.find(
                highlightedTile => highlightedTile.x === prevTileCoords.x &&
                    highlightedTile.y === prevTileCoords.y
            ))
            previousClueHighlightChain.highlights.push(tile)
            if(previousClueHighlightChain.theme) {
                themeClues[DIRECTION][previousClueHighlightChain.id] = true;
                themeClues.tiles.push(tile);
            }
        }
    }

    tileBoard.forEach((row, y) => {
        row.forEach((t, x) => {
            const newClueNumber = clueNumber;
            if(t.blank) {
                return;
            }

            totalNumberOfBoardLetters++;

            const tile = {x, y}
            newTileBoard[y][x].clueNumberLink = {};

            prepareTile(prepTileConfig.HORIZONTAL, tile, newClueNumber)
            prepareTile(prepTileConfig.VERTICAL, tile, newClueNumber)
        })
    });

    return {
        board: tileBoard,
        clues: cluesWithTileRef,
        totalNumberOfBoardLetters,
        _isLocationOnBoard,
        isLocationOnBoard,
        isTile,
        isTileAtCoords,
        getTileBoardItem,
        themeClues
    }
}
