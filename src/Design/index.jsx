import React, {useEffect, useRef, useState} from 'react';
import GameBoard from "../Game";
import cloneDeep from "lodash/cloneDeep";

import {emptyDesignBoard, emptyTile, block, initDesignBoard} from "../Game/initBoard";

const Design = () => {
    const [gameData, setGameData] = useState(emptyDesignBoard);

    const saveConfig = useRef({ save: () => console.log("Save error") }).current;

    const toggleTileBlock = (event, tile, game) => {
        event.preventDefault();
        const newData = cloneDeep(game);
        newData.board[tile.y][tile.x] = newData.isTile(tile) ? block() : emptyTile();
        setGameData(initDesignBoard(newData));
    }

    return <GameBoard game={gameData} saveConfig={saveConfig} rightClick={toggleTileBlock} />
}

export default Design;
