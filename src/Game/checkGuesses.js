import cloneDeep from "lodash/cloneDeep";
import {fonts, renderPixels} from "js-pixel-fonts";

const checkBoardAnswersCorrect = (
    game,
    gameWon,
    setGameWon,
    throttledIncorrectGuessNumberOpen,
    setTimestamp,
    preventKeyPress
) => {
    if(gameWon) {
        return;
    }

    let countIncorrectGuesses = 0;
    game.board.forEach((row, y) => row.forEach((tile, x) => {
        if (!game.board[y][x].blank && tile.guess !== game.board[y][x].answer.toUpperCase()) {
            countIncorrectGuesses++;
        }
    }))

    if(countIncorrectGuesses !== 0) {
        throttledIncorrectGuessNumberOpen();
        return;
    }

    setGameWon(true);

    const tileBoardSnapshot = cloneDeep(game.board);
    const messageBoard = cloneDeep(game.board);
    const messageBoardSnapshots = []

    // config
    const startDelay = 3000;
    const messageSpeed = 175;
    const finishMessagePixels = renderPixels(game.gameFinishedMessage, fonts.sevenPlus);

    const pixelHeight = finishMessagePixels.length;
    const boardWidth = messageBoard[0].length;
    const numberOfPixelRenders = finishMessagePixels[0].length;
    if(boardWidth >= 7) {
        const yStart = (boardWidth - pixelHeight) / 2;
        for(let i = 0; i < numberOfPixelRenders; i++) {
            for(let y = 0; y < pixelHeight; y++) {
                for(let x = 0; x < boardWidth; x ++) {
                    if(x === boardWidth - 1) {
                        messageBoard[y + yStart][x].finishMessagePixel = finishMessagePixels[y].shift();
                    } else {
                        messageBoard[y + yStart][x].finishMessagePixel = messageBoard[y + yStart][x + 1].finishMessagePixel;
                    }
                }
            }
            messageBoardSnapshots.push(cloneDeep(messageBoard));
        }
        messageBoardSnapshots.forEach((snapshotOfBoard, i) => setTimeout(() => { game.board = snapshotOfBoard; setTimestamp(Date.now()) }, startDelay + (messageSpeed * i)));
        const gameTimeEnd = startDelay + (messageBoardSnapshots.length * messageSpeed);
        setTimeout(() => {
            setGameWon(false);
            game.board = tileBoardSnapshot;
            setTimestamp(Date.now())
            preventKeyPress.current = false;
        }, gameTimeEnd + startDelay);
    }
}

export default checkBoardAnswersCorrect;
