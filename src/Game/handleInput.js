import {
    ARROW_KEY_MAPPINGS, BACKSPACE_KEY, DELETE_KEY,
    HORIZONTAL,
    HORIZONTAL_ARROW_KEYS, SPACE_KEY,
    VERTICAL,
    VERTICAL_ARROW_KEYS
} from "./constants";
import { prepTileConfig } from "./utils";

import { getOppositeDirection } from "./utils";

const arrowKeyPressInDirection = (pressedDirection, key, game, activateTile) => {
    const arrowKeyMapping = ARROW_KEY_MAPPINGS[key];

    if(game.selectedTile.x === null || game.selectedTile.y === null) {
        console.log("Issue with selected tile", game.selectedTile)
    }

    if(game.direction !== pressedDirection) {
        let nextTile = arrowKeyMapping(game.selectedTile)
        if(!game.getClueIdFromTile(game.selectedTile, pressedDirection)) {
            for(let i = 1; game._isLocationOnBoard(nextTile); i++, nextTile = arrowKeyMapping(game.selectedTile, i)) {
                if(game.isTile(nextTile)) {
                    let tileDirection = pressedDirection;
                    if(!game.getClueIdFromTile(nextTile, tileDirection)) {
                        tileDirection = getOppositeDirection(pressedDirection);
                    }
                    game.direction = tileDirection;
                    activateTile(nextTile, tileDirection);
                    return;
                }
            }
        } else {
            game.direction = pressedDirection;
            activateTile(game.selectedTile, pressedDirection);
        }
    } else {
        if(arrowKeyMapping) {
            let nextTile = arrowKeyMapping(game.selectedTile);
            for(let i = 1; game._isLocationOnBoard(nextTile); i++) {
                nextTile = arrowKeyMapping(game.selectedTile, i);
                if(game.isTile(nextTile)) {
                    if(i !== 1) {
                        if(!game.getClueIdFromTile(nextTile, pressedDirection)) {
                            pressedDirection = Object.keys(game.board[nextTile.y][nextTile.x].clueNumberLink)[0];
                        }
                        game.direction = pressedDirection;
                    }
                    activateTile(nextTile, pressedDirection)
                    return;
                }
            }
        }
    }
}

export const arrowKeyPress = (key, game, activateTile) => {
    if(HORIZONTAL_ARROW_KEYS.includes(key)) {
        arrowKeyPressInDirection(HORIZONTAL, key, game, activateTile);
    } else if(VERTICAL_ARROW_KEYS.includes(key)) {
        arrowKeyPressInDirection(VERTICAL, key, game, activateTile);
    }
}

export const letterKeyPres = (key, game, activateTile, setTimestamp, checkBoardAnswersCorrect) => {
    if(!game.isTile(game.selectedTile)) {
        return;
    }
    game.getTileBoardItem(game.selectedTile).guess = key.toUpperCase();
    moveSelectorOneSpaceInDirection(game, activateTile);

    let numberOfGuesses = 0;
    game.board.forEach(row => row.forEach(tile => tile.guess && numberOfGuesses++));
    if(numberOfGuesses === game.totalNumberOfBoardLetters) {
        checkBoardAnswersCorrect();
    }
}

const moveSelectorOneSpaceInDirection = (game, activateTile) => {
    const NEXT_TILE = prepTileConfig[game.direction].NEXT_TILE;

    const clueId = game.getClueIdFromTile(game.selectedTile, game.direction);
    const clue = game.getClue(clueId);
    const wordLength = (game.direction === HORIZONTAL ? clue.endTile.x - clue.tile.x : clue.endTile.y - clue.tile.y) + 1;
    let keepSearching = true;
    let reachedEnd = false;

    for(let i = 1, tileIndex = 1; i < wordLength && keepSearching; i++, tileIndex++) {
        let nextTile = NEXT_TILE(reachedEnd ? clue.tile : game.selectedTile, tileIndex);
        if(!game.isTile(nextTile) && !reachedEnd) {
            tileIndex = 0; // reset to start of clue
            nextTile = NEXT_TILE(clue.tile, tileIndex);
            reachedEnd = true;
        }

        if (game.isTile(nextTile)) {
            if (!game.getTileBoardItem(nextTile).guess) {
                activateTile(nextTile, game.direction)
                keepSearching = false;
            }
        }
    }
    if(keepSearching) {
        const nextTile = game.isTile(NEXT_TILE(game.selectedTile)) ? NEXT_TILE(game.selectedTile) : game.selectedTile;
        activateTile(nextTile, game.direction);
    }
}

const removeGuessFromTile = (selectedTile, game, setTimestamp) => {
    game.getTileBoardItem(selectedTile).guess = '';
    setTimestamp(Date.now()); // force rerender
}

export const clearLetterKey = (key, game, activateTile, setTimestamp) => {
    const { DIRECTION, NEXT_TILE, PREV_TILE } = prepTileConfig[game.direction];
    const tile = game.selectedTile;
    if(key === SPACE_KEY) {
        // if(game.previousKeyWasDelete) {
        //     moveSelectorOneSpaceInDirection(game, activateTile)
        //     game.previousKeyWasDelete = true;
        //     return;
        // }
        game.previousKeyWasDelete = true;
        removeGuessFromTile(tile, game, setTimestamp);
        if(game.isTile(NEXT_TILE(tile))) {
            activateTile(NEXT_TILE(tile))
        } else {
            const clueId = game.getClueIdFromTile(tile, DIRECTION);
            const clue = game.getClue(clueId);
            activateTile(clue.tile)
        }
    } else if(key === BACKSPACE_KEY) {
        if(game.getTileBoardItem(tile).guess !== '') {
            removeGuessFromTile(tile, game, setTimestamp);
        } else if (game.isTile(PREV_TILE(tile))) {
            removeGuessFromTile(PREV_TILE(tile), game, setTimestamp);
            game.previousKeyWasDelete = true;
            activateTile(PREV_TILE(tile))
        }
    } else if(key === DELETE_KEY) {
        removeGuessFromTile(tile, game, setTimestamp);
    }
}

export const tabKeyPress = (shiftKey, game, activateTile) => {
    const indexModifier = shiftKey ? -1 : 1;
    let direction = game.direction;
    let clueIndex = game.clues[direction].findIndex(item => item.id === game.getClueIdFromTile()) + indexModifier;

    if (!game.clues[direction][clueIndex]) {
        direction = getOppositeDirection(direction)
        if (clueIndex < 0) {
            clueIndex = game.clues[direction].length - 1;
        } else {
            clueIndex = 0;
        }
    }
    // TODO don't just tab to the beginnign of the next clue, make sure it has space or skip it
    game.direction = direction;
    activateTile(game.clues[direction][clueIndex].tile, direction);
}
