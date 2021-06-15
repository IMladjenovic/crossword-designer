import { block } from "../Crossword/initBoard";
import {HORIZONTAL} from "../Crossword/constants";

export const verifyPublish = game => {
    let issue = '';
    game.board.forEach((row, y) => row.forEach((cell, x) => {
        if(!cell.blank && cell.guess === '') {
            issue = `All tiles must have a letter`
        }
    }))
    return issue;
}

export const publish = ({ board, clues, gameFinishedMessage, title }) => ({
    board: board.map(row => row.map(cell => cell.blank ? block() : { ...cell, answer: cell.guess, guess: '' })),
    clues,
    gameFinishedMessage,
    title,
    selectedTile: { x: 0, y: 0 },
    direction: HORIZONTAL
})
