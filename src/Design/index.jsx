import React, {useRef, useState} from 'react';
import GameBoard from "../Game";

import { initBoard } from "../Game/initBoard";
import data from './empty-game.json';

const Design = () => {
    const [gameData, setGameData] = useState(initBoard(data));

    const [designGame, setDesignGame] = useState(false);

    const saveConfig = useRef({ save: () => console.log("Save error") }).current;


    return <GameBoard data={gameData} saveConfig={saveConfig} />
}

export default Design;
