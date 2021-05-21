import {
    ARROW_KEY_MAPPINGS, BACKSPACE_KEY, DELETE_KEY,
    HORIZONTAL,
    HORIZONTAL_ARROW_KEYS, SPACE_KEY, TILE_ABOVE, TILE_BELOW, TILE_LEFT,
    TILE_RIGHT,
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
        if(!game.getTileBoardItem(game.selectedTile).clueNumberLink[pressedDirection]) {
            for(let i = 1; game._isLocationOnBoard(nextTile); i++, nextTile = arrowKeyMapping(game.selectedTile, i)) {
                if(game.isTile(nextTile)) {
                    let tileDirection = pressedDirection;
                    if(!game.getTileBoardItem(nextTile).clueNumberLink[tileDirection]) {
                        tileDirection = getOppositeDirection(pressedDirection);
                    }
                    game.direction = tileDirection;
                    activateTile(nextTile, tileDirection);
                    console.log("arrowKeyPress End", Date.now())
                    return;
                }
            }
        } else {
            game.direction = pressedDirection;
            activateTile(game.selectedTile, pressedDirection, { selectTile: false });
        }
    } else {
        if(arrowKeyMapping) {
            let nextTile = arrowKeyMapping(game.selectedTile);
            for(let i = 1; game._isLocationOnBoard(nextTile); i++) {
                nextTile = arrowKeyMapping(game.selectedTile, i);
                if(game.isTile(nextTile)) {
                    let options = { highlightTiles: false, selectedClue: false }
                    if(i !== 1) {
                        options = {};
                        if(!game.getTileClue(nextTile, pressedDirection)) {
                            pressedDirection = Object.keys(game.board[nextTile.y][nextTile.x].clueNumberLink)[0];
                        }
                        game.direction = pressedDirection;
                    }
                    activateTile(nextTile, pressedDirection)
                    console.log("arrowKeyPress End", Date.now())
                    return;
                }
            }
        }
    }
}

export const arrowKeyPress = (key, game, activateTile) => {
    console.log("arrowKeyPress", Date.now())
    if(HORIZONTAL_ARROW_KEYS.includes(key)) {
        arrowKeyPressInDirection(HORIZONTAL, key, game, activateTile);
    } else if(VERTICAL_ARROW_KEYS.includes(key)) {
        arrowKeyPressInDirection(VERTICAL, key, game, activateTile);
    }
}

export const letterKeyPres = (key, game, activateTile, setTimestamp, checkBoardAnswersCorrect) => {
    console.log("letterKeyPres", Date.now())
    if(!game.isTile(game.selectedTile)) {
        return;
    }
    game.getTileBoardItem(game.selectedTile).guess = key.toUpperCase();
    moveSelectorOneSpaceInDirection(game, activateTile, setTimestamp);

    let numberOfGuesses = 0;
    game.board.forEach(row => row.forEach(tile => tile.guess && numberOfGuesses++));
    if(numberOfGuesses === game.totalNumberOfBoardLetters) {
        checkBoardAnswersCorrect();
    }
    console.log("letterKeyPres End", Date.now())
}

const moveSelectorOneSpaceInDirection = (game, activateTile, setTimestamp, reverse = 1) => {
    console.log("moveSelectorOneSpaceInDirection", Date.now())

    const tileConf = prepTileConfig[game.direction];
    const nxtTile = tileConf.NEXT_TILE(game.selectedTile);

    // is the immediate next Tile free
    // if(game.isTile(nxtTile) && !game.getTileBoardItem(nxtTile).guess) {
    //     console.log("moveSelectorOneSpaceInDirection Pre-render", Date.now())
    //     activateTile(nxtTile, game.direction)
    //     console.log("moveSelectorOneSpaceInDirection NEW End", Date.now())
    //     return;
    // }

    const clueId = game.getTileBoardItem(game.selectedTile).clueNumberLink[game.direction];
    const clue = game.clues[game.direction].find(c => c.id === clueId);
    const numberOfLettersInAnswer = clue.highlights.length;
    const indexOfSelectedTileInAnswer = clue.highlights.findIndex(tile => tile.x === game.selectedTile.x && tile.y === game.selectedTile.y);
    const startingPos = game.direction === HORIZONTAL ? clue.tile.x : clue.tile.y;
    let foundEmptyTileInAnswer = false;
    for(let i = 0; i < numberOfLettersInAnswer; i++) {
        const index = (((i * reverse) + numberOfLettersInAnswer + indexOfSelectedTileInAnswer + 1) % numberOfLettersInAnswer) + startingPos;
        const hSuggestedClue = { x: index, y: game.selectedTile.y };
        const vSuggestedClue = { x: game.selectedTile.x, y: index };
        if(game.direction === HORIZONTAL && game.isTile(hSuggestedClue) && !game.getTileBoardItem(hSuggestedClue).guess) {
            console.log("moveSelectorOneSpaceInDirection Pre-render", Date.now())
            activateTile(hSuggestedClue, HORIZONTAL)
            foundEmptyTileInAnswer = true;
            console.log("moveSelectorOneSpaceInDirection End", Date.now())
            return;
        } else if(game.direction === VERTICAL && game.isTile(vSuggestedClue) && !game.getTileBoardItem(vSuggestedClue).guess) {
            console.log("moveSelectorOneSpaceInDirection Pre-render", Date.now())
            activateTile(vSuggestedClue, VERTICAL)
            foundEmptyTileInAnswer = true;
            console.log("moveSelectorOneSpaceInDirection End", Date.now())
            return;
        }
    }
    if(!foundEmptyTileInAnswer) {
        if(game.direction === HORIZONTAL && game.isTile(TILE_RIGHT(game.selectedTile))) {
            console.log("moveSelectorOneSpaceInDirection Pre-render", Date.now())
            activateTile(TILE_RIGHT(game.selectedTile), HORIZONTAL)
        } else if(game.direction === VERTICAL && game.isTile(TILE_BELOW(game.selectedTile))) {
            console.log("moveSelectorOneSpaceInDirection Pre-render", Date.now())
            activateTile(TILE_BELOW(game.selectedTile), VERTICAL)
        } else {
            console.log("moveSelectorOneSpaceInDirection Pre-render", Date.now())
            setTimestamp(Date.now()); // force rerender
        }
    }
    console.log("moveSelectorOneSpaceInDirection End", Date.now())
}

const removeGuessFromTile = (selectedTile, game, setTimestamp) => {
    game.getTileBoardItem(selectedTile).guess = '';
    setTimestamp(Date.now()); // force rerender
}

export const clearLetterKey = (key, game, activateTile, setTimestamp) => {
    if(key === SPACE_KEY) {
        const shouldOnlySingleSpaceMove = game.getTileBoardItem(game.selectedTile).guess !== '' || game.previousKeyWasDelete === true;
        if(game.direction === HORIZONTAL && shouldOnlySingleSpaceMove) {
            game.previousKeyWasDelete = true;
            removeGuessFromTile(game.selectedTile, game, setTimestamp);
            if(game.isTile(TILE_RIGHT(game.selectedTile))) {
                activateTile(TILE_RIGHT(game.selectedTile))
            } else {
                const clueId = game.getTileBoardItem(game.selectedTile).clueNumberLink[game.direction];
                const clue = game.clues[HORIZONTAL].find(c => c.id === clueId);
                const beginningClue = clue.highlights[0];
                activateTile(beginningClue)
            }
        } else if(game.direction === VERTICAL && shouldOnlySingleSpaceMove) {
            game.previousKeyWasDelete = true;
            removeGuessFromTile(game.selectedTile, game, setTimestamp);
            if(game.isTile(TILE_BELOW(game.selectedTile))) {
                activateTile(TILE_BELOW(game.selectedTile))
            } else {
                const clueId = game.getTileBoardItem(game.selectedTile).clueNumberLink[game.direction];
                const clue = game.clues[VERTICAL].find(c => c.id === clueId);
                const beginningClue = clue.highlights[0];
                activateTile(beginningClue)
            }
        } else {
            // setTimestamp(Date.now()); // force rerender
            moveSelectorOneSpaceInDirection(game, activateTile, setTimestamp);
        }
    } else if(key === BACKSPACE_KEY) {
        if(game.getTileBoardItem(game.selectedTile).guess !== '') {
            removeGuessFromTile(game.selectedTile, game, setTimestamp);
        } else if(game.direction === HORIZONTAL && game.isTile(TILE_LEFT(game.selectedTile))) {
            removeGuessFromTile(TILE_LEFT(game.selectedTile), game, setTimestamp);
            game.previousKeyWasDelete = true;
            activateTile(TILE_LEFT(game.selectedTile))
        } else if(game.direction === VERTICAL && game.isTile(TILE_ABOVE(game.selectedTile))) {
            removeGuessFromTile(TILE_ABOVE(game.selectedTile), game, setTimestamp);
            game.previousKeyWasDelete = true;
            activateTile(TILE_ABOVE(game.selectedTile))
        }
        removeGuessFromTile(game.selectedTile, game, setTimestamp);
    } else if(key === DELETE_KEY) {
        removeGuessFromTile(game.selectedTile, game, setTimestamp);
    }
}
