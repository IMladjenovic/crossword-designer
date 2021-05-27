import React, {useRef} from 'react';
import GameBoard from "../Game";

const Play = ({ gameData }) => {

    const saveConfig = useRef({ save: () => console.log("Save error") }).current;

    const toggleTileBlock = (event) => {
        event.preventDefault();
    }

    return <GameBoard game={gameData} saveConfig={saveConfig} rightClick={toggleTileBlock} />
}

export default Play;
