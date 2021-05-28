import React, {useRef, useState} from 'react';
import GameBoard from "../Game";
import RemoveCircleSharpIcon from '@material-ui/icons/RemoveCircleSharp';
import AddCircleSharpIcon from '@material-ui/icons/AddCircleSharp';

import cloneDeep from "lodash/cloneDeep";
import drop from "lodash/drop";
import dropRight from "lodash/dropRight";
import last from "lodash/last";
import first from "lodash/first";
import pullAt from "lodash/pullAt";

import {emptyDesignBoard, emptyTile, block, initDesignBoard} from "../Game/initBoard";

const Design = () => {
    const [gameData, setGameData] = useState(emptyDesignBoard);
    const [timestamp, setTimestamp] = useState(Date.now())

    const saveConfig = useRef({ save: () => console.log("Save error") }).current;

    const toggleTileBlock = (event, tile, game) => {
        event.preventDefault();
        const gameC = cloneDeep(game);
        gameC.board[tile.y][tile.x] = gameC.isTile(tile) ? block() : emptyTile();
        setGameData(initDesignBoard(gameC));
    }

    const modifyBoardLength = (start, add) => {
        let method;
        if(add) {
            method = array => start ? array.unshift(first(array)) : array.push(last(array))
        } else {
            method = array => start ? array.shift() : array.pop();
        }
        const gameC = cloneDeep(gameData);
        gameC.board.forEach(row => method(row));
        method(gameC.board);
        setGameData(initDesignBoard(gameC));
    }

    const ModifyGameBoardLengthStart = () => {
        return (
            <div>
                <AddCircleSharpIcon onClick={() => modifyBoardLength(true, true)} style={{ color: "green" }} />
                <RemoveCircleSharpIcon onClick={() => modifyBoardLength(true, false)} style={{ color: "red" }} />
            </div>
        )
    }

    const ModifyGameBoardLengthEnd = () => {
        return (
            <div style={{ display: "flex", alignItems: "flex-end" }}>
                <div onClick={() => modifyBoardLength(false, true)}>
                    <AddCircleSharpIcon style={{ color: "green" }} />
                </div>
                <div onClick={() => modifyBoardLength(false, false)}>
                    <RemoveCircleSharpIcon style={{ color: "red" }} />
                </div>
            </div>
        )
    }

    return <GameBoard child1={<ModifyGameBoardLengthStart />} child2={<ModifyGameBoardLengthEnd />} game={gameData} saveConfig={saveConfig} rightClick={toggleTileBlock} />
}

export default Design;
