import './App.css';
import React from "react";
import GameBoard from "./gameBoard";

const E = { guess: '', answer: 'A' }
const B = { blank: 'yes' }

const EXAMPLE_BOARD = [
    [E, E],
    [E, B]
]

function App() {
  return (
    <div className="App" className="GameBoard" >
      <GameBoard tileBoard={EXAMPLE_BOARD} />
    </div>
  );
}

export default App;
