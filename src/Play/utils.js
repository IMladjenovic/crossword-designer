import {getOppositeDirection} from "../Crossword/utils";

export const focusClues = (game, clueRefs) => {
    const primaryClueId = game.getClueIdFromTile(game.selectedTile, game.direction);
    const secondaryClueId = game.getClueIdFromTile(game.selectedTile, getOppositeDirection(game.direction));

    if(secondaryClueId) {
        clueRefs[secondaryClueId].focus();
    }
    clueRefs[primaryClueId].focus();
}
