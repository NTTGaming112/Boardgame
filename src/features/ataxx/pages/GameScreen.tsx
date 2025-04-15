import { useState, useEffect } from "react";
import { Button } from "@/ui/button";
import { Avatar, AvatarFallback } from "@/ui/avatar";
import { useNavigate } from "react-router-dom";
import Board from "../components/Board";
import Notification from "@/ui/Notification";
import {
  initializeBoard,
  calculateScores,
  isValidMove,
  makeMove,
  checkGameOver,
  determineWinner,
} from "../gameLogic/ataxxLogic";
import { GameState, Side, Position } from "../types";

interface GameScreenProps {
  boardLayout: number;
  playerSide: Side;
  gameType: "single" | "multi";
}

const GameScreen: React.FC<GameScreenProps> = ({
  boardLayout,
  playerSide,
  gameType,
}) => {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState<GameState>({
    board: initializeBoard(boardLayout),
    currentPlayer: "yellow",
    yellowScore: 0,
    redScore: 0,
    gameOver: false,
    winner: null,
  });
  const [showGameOver, setShowGameOver] = useState(false);

  useEffect(() => {
    const scores = calculateScores(gameState.board);
    setGameState((prev) => ({
      ...prev,
      yellowScore: scores.yellowScore,
      redScore: scores.redScore,
    }));
  }, [gameState.board]);

  useEffect(() => {
    if (checkGameOver(gameState.board)) {
      const winner = determineWinner(gameState.board);
      setGameState((prev) => ({
        ...prev,
        gameOver: true,
        winner,
      }));
      setShowGameOver(true);
    }
  }, [gameState.board]);

  const handleMove = (from: Position, to: Position) => {
    if (gameState.gameOver) return;

    if (isValidMove(gameState.board, from, to, gameState.currentPlayer)) {
      const newBoard = makeMove(
        gameState.board,
        from,
        to,
        gameState.currentPlayer
      );
      setGameState((prev) => ({
        ...prev,
        board: newBoard,
        currentPlayer: prev.currentPlayer === "yellow" ? "red" : "yellow",
      }));
    }
  };

  const handleRestart = () => {
    setGameState({
      board: initializeBoard(boardLayout),
      currentPlayer: "yellow",
      yellowScore: 0,
      redScore: 0,
      gameOver: false,
      winner: null,
    });
    setShowGameOver(false);
  };

  const handleBack = () => {
    navigate("/setup");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-green-700 p-4">
      {showGameOver && (
        <Notification
          title="Game Over"
          description={`Winner: ${gameState.winner || "Draw"}`}
          variant="default"
          onClose={() => setShowGameOver(false)}
        />
      )}
      <div className="text-white text-xl mb-4 w-full max-w-md">
        <div className="flex items-center space-x-3 mb-2">
          <Avatar className="w-10 h-10">
            <AvatarFallback className="bg-yellow-400 text-black">
              Y
            </AvatarFallback>
          </Avatar>
          <span>Yellow Score: {gameState.yellowScore}</span>
        </div>
        <div className="flex items-center space-x-3 mb-2">
          <Avatar className="w-10 h-10">
            <AvatarFallback className="bg-red-500 text-white">R</AvatarFallback>
          </Avatar>
          <span>Red Score: {gameState.redScore}</span>
        </div>
        <div className="flex items-center space-x-3">
          <Avatar className="w-10 h-10">
            <AvatarFallback
              className={
                gameState.currentPlayer === "yellow"
                  ? "bg-yellow-400 text-black"
                  : "bg-red-500 text-white"
              }
            >
              {gameState.currentPlayer === "yellow" ? "Y" : "R"}
            </AvatarFallback>
          </Avatar>
          <span>Current Player: {gameState.currentPlayer}</span>
        </div>
      </div>
      <Board
        board={gameState.board}
        currentPlayer={gameState.currentPlayer}
        onMove={handleMove}
      />
      <div className="flex space-x-4 mt-4">
        <Button
          onClick={handleRestart}
          className="bg-yellow-600 hover:bg-yellow-700 text-white"
        >
          Restart Game
        </Button>
        <Button
          onClick={handleBack}
          className="bg-gray-600 hover:bg-gray-700 text-white"
        >
          Back to Setup
        </Button>
      </div>
    </div>
  );
};

export default GameScreen;
