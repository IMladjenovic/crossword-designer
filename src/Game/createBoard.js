import clone from "lodash/clone";
import {HORIZONTAL, TILE_ABOVE, TILE_BELOW, TILE_LEFT, TILE_RIGHT, VERTICAL} from "./constants";

// refactoring crossword initialisation
const createBoard = (tileBoard, setters) => {
    let clueNumber = 0;
    const cluesWithTileRef = {
        HORIZONTAL: [],
        VERTICAL: []
    }

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

    const shouldUpdateTotalNumberOfBoardLetters = totalNumberOfBoardLetters.current === 0;

    const newTileBoard = clone(tileBoard);
    tileBoard.forEach((row, y) => {
        row.forEach((t, x) => {
            const newClueNumber = clueNumber;
            if(t.blank) {
                return;
            }
            if(shouldUpdateTotalNumberOfBoardLetters) {
                totalNumberOfBoardLetters.current++;
            }
            const tile = {x, y}

            const tileAboveCoords = TILE_ABOVE(tile);

            if(!isTile(tileAboveCoords)) {
                if(isTile(TILE_BELOW(tile))) {
                    updateClueNumber(newClueNumber, newTileBoard, tile);
                    const vClue = clues.VERTICAL[cluesWithTileRef.VERTICAL.length];

                    vClue.tile = tile;
                    vClue.id = clueId(VERTICAL, clueNumber);
                    vClue.clueNumber = clueNumber;
                    vClue.highlights = [];
                    if(vClue.theme) {
                        themeClues.current[VERTICAL][vClue.id] = true;
                        themeClues.current.tiles.push(tile);
                    }

                    vClue.highlights.push(tile);
                    newTileBoard[y][x].clueNumberLink =
                        { ...newTileBoard[y][x].clueNumberLink, VERTICAL: clueId(VERTICAL, clueNumber) };
                    cluesWithTileRef.VERTICAL.push(vClue);
                }
            } else {
                const tileAbove = newTileBoard[tileAboveCoords.y][tileAboveCoords.x];
                newTileBoard[y][x].clueNumberLink =
                    { ...newTileBoard[y][x].clueNumberLink, VERTICAL: tileAbove.clueNumberLink.VERTICAL };
                if(tileAbove.theme) {
                    themeClues.current[VERTICAL][tileAbove.id] = true;
                    themeClues.current.tiles.push(tile);
                }
                const previousVertClueHighlightChain = cluesWithTileRef.VERTICAL.find(clue => clue.highlights.find(
                    highlightedTile => highlightedTile.x === tileAboveCoords.x &&
                        highlightedTile.y === tileAboveCoords.y
                ))
                previousVertClueHighlightChain.highlights.push(tile)
                if(previousVertClueHighlightChain.theme) {
                    themeClues.current[VERTICAL][previousVertClueHighlightChain.id] = true;
                    themeClues.current.tiles.push(tile);
                }
            }

            const tileLeftCoords = TILE_LEFT(tile);


            if(!isTile(tileLeftCoords)) {
                if(isTile(TILE_RIGHT(tile))) {
                    updateClueNumber(newClueNumber, newTileBoard, tile);
                    const vClue = clues.HORIZONTAL[cluesWithTileRef.HORIZONTAL.length];
                    vClue.tile = tile;
                    vClue.id = clueId(HORIZONTAL, clueNumber);
                    if(vClue.theme) {
                        themeClues.current[HORIZONTAL][vClue.id] = true;
                        themeClues.current.tiles.push(tile);
                    }
                    vClue.clueNumber = clueNumber;
                    vClue.highlights = [];
                    cluesWithTileRef.HORIZONTAL.push(vClue);
                    vClue.highlights.push(tile);
                    newTileBoard[y][x].clueNumberLink =
                        { ...newTileBoard[y][x].clueNumberLink, HORIZONTAL: clueId(HORIZONTAL, clueNumber) };
                }
            } else {
                const tileLeft = newTileBoard[tileLeftCoords.y][tileLeftCoords.x];
                newTileBoard[y][x].clueNumberLink =
                    { ...newTileBoard[y][x].clueNumberLink, HORIZONTAL: tileLeft.clueNumberLink.HORIZONTAL };
                if(tileLeft.theme) {
                    themeClues.current[HORIZONTAL][tileLeft.id] = true;
                    themeClues.current.tiles.push(tile);
                }
                const previousVertClueHighlightChain = cluesWithTileRef.HORIZONTAL.find(clue => clue.highlights.find(
                    highlightedTile => highlightedTile.x === tileLeftCoords.x &&
                        highlightedTile.y === tileLeftCoords.y
                ))
                previousVertClueHighlightChain.highlights.push(tile);
                if(previousVertClueHighlightChain.theme) {
                    themeClues.current[HORIZONTAL][previousVertClueHighlightChain.id] = true;
                    themeClues.current.tiles.push(tile);
                }
            }
        })
    });
    setters.setClues(cluesWithTileRef);
    setters.setTileBoard(newTileBoard);
}