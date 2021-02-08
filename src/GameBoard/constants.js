// export const TILE_SIZE = 33;
export const ALPHABET =
    ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z']
export const ALPHABET_LOWER = ALPHABET.map(letter => letter.toLocaleLowerCase())
export const HORIZONTAL = 'HORIZONTAL';
export const VERTICAL = 'VERTICAL';
export const DIRECTIONS = [HORIZONTAL, VERTICAL];
export const ARROW_LEFT = 'ArrowLeft';
export const ARROW_RIGHT = 'ArrowRight';
export const ARROW_UP = 'ArrowUp';
export const ARROW_DOWN = 'ArrowDown';
export const DEFAULT_DIRECTION = HORIZONTAL;
export const HORIZONTAL_ARROW_KEYS = [ARROW_LEFT, ARROW_RIGHT];
export const VERTICAL_ARROW_KEYS = [ARROW_UP, ARROW_DOWN];
export const ALL_DIRECTIONAL_KEYS = [...VERTICAL_ARROW_KEYS, ...HORIZONTAL_ARROW_KEYS];
export const ARROW_KEY_MAPPINGS = {
    ArrowLeft: (tile, amount= 1) => TILE_LEFT(tile, amount),
    ArrowRight: (tile, amount = 1) => TILE_RIGHT(tile, amount),
    ArrowUp: (tile, amount = 1) => TILE_ABOVE(tile, amount),
    ArrowDown: (tile, amount = 1) => TILE_BELOW(tile, amount),
};
export const TILE_LEFT = ({x, y}, amount= 1) => ({x: x - amount, y});
export const TILE_RIGHT = ({x, y}, amount = 1) => ({x: x + amount, y});
export const TILE_ABOVE = ({x, y}, amount = 1) => ({x, y: y - amount});
export const TILE_BELOW = ({x, y}, amount = 1) => ({x, y: y + amount});
export const DELETE_KEYS = ['Delete', 'Backspace', ' '];
export const CLUE_COLUMN_TITLE = { HORIZONTAL: 'Across', VERTICAL: 'Down' }