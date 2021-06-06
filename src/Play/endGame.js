import cloneDeep from "lodash/cloneDeep";
import {fonts, renderPixels} from "js-pixel-fonts";

export const activateEndGameMessage = (game, setGameWon, setTimestamp) => {
    const boardWidth = game.board.length;
    if(boardWidth < 9) {
        setTimeout(() => {
            setGameWon(false);
            game.board = tileBoardSnapshot;
            setTimestamp(Date.now())
        }, 10000);
        return;
    }

    const tileBoardSnapshot = cloneDeep(game.board);
    const messageBoard = cloneDeep(game.board);
    const messageBoardSnapshots = []

    // config
    const startDelay = 1000;
    const messageSpeed = 175;
    const finishMessagePixels = renderPixels(game.gameFinishedMessage, fonts.sevenPlus);

    const pixelDisplayHeight = finishMessagePixels.length;
    const numberOfPixelRenders = finishMessagePixels[0].length;

    const yStart = (boardWidth - pixelDisplayHeight) / 2;
    for(let i = 0; i < numberOfPixelRenders; i++) {
        for(let y = 0; y < pixelDisplayHeight; y++) {
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
    }, gameTimeEnd + startDelay);
}