// import React, { useEffect, useState } from 'react';
import { GameProvider, useGame } from './context/GameContext';
import { Lobby } from './components/Lobby';
import { Board } from './components/Board';

const GameContainer = () => {
  const { gameState } = useGame();

  if (!gameState) {
    return <Lobby />;
  }

  return <Board />;
};

function App() {
  return (
    <GameProvider>
      <GameContainer />
    </GameProvider>
  );
}

export default App;
