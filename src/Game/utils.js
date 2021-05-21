import {DIRECTIONS, HORIZONTAL, TILE_ABOVE, TILE_BELOW, TILE_LEFT, TILE_RIGHT, VERTICAL} from "./constants";
import difference from "lodash/difference";

export const getOppositeDirection = direction => {
    if(DIRECTIONS.includes(direction)) {
        return difference(DIRECTIONS, [direction])[0];
    } else {
        throw new Error("tried to get opposite direction of " + direction);
    }
}

export const prepTileConfig = {
    VERTICAL: {
        DIRECTION: VERTICAL,
        NEXT_TILE: TILE_BELOW,
        PREV_TILE: TILE_ABOVE
    },
    HORIZONTAL: {
        DIRECTION: HORIZONTAL,
        NEXT_TILE: TILE_RIGHT,
        PREV_TILE: TILE_LEFT
    }
}
