import { useState, useEffect } from "react";
import { Button } from "@/ui/button";
import { Avatar, AvatarFallback } from "@/ui/avatar";
import { useLocation, useNavigate } from "react-router-dom";
import Board from "../components/Board";
import Notification from "@/ui/Notification";
import {
  initializeBoard,
  calculateScores,
  isValidMove,
  makeMove,
  checkGameOver,
  determineWinner,
  hasValidMoves,
  getAllValidMoves,
} from "../gameLogic/ataxxLogic";
import { GameState, Side, Position, BoardState } from "../types";
import { Input } from "@/ui/input";
import BotSettings from "../components/BotSetting";
import { error } from "console";

interface GameScreenProps {
  boardLayout: number;
  playerSide: Side;
  gameType: "multi" | "bot-vs-bot";
}

const GameScreen: React.FC<GameScreenProps> = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { gameType, boardLayout, playerSide } =
    location.state as GameScreenProps;

  const [gameState, setGameState] = useState<GameState>({
    board: initializeBoard(boardLayout),
    currentPlayer: "yellow",
    yellowScore: 0,
    redScore: 0,
    gameOver: false,
    winner: null,
  });

  const [showGameOver, setShowGameOver] = useState(false);
  const [moveHistory, setMoveHistory] = useState<
    { from: Position; to: Position }[]
  >([]);
  const [numGames, setNumGames] = useState<number>(1);
  const [algorithm, setAlgorithm] = useState<{ yellow: string; red: string }>({
    yellow: "mcts-binary",
    red: "mcts-binary",
  });
  const [iterations, setIterations] = useState<{ yellow: number; red: number }>(
    { yellow: 100, red: 100 }
  );
  const [isPlayingBotVsBot, setIsPlayingBotVsBot] = useState(false);
  const [scoreboard, setScoreboard] = useState({
    yellowWins: 0,
    redWins: 0,
    draws: 0,
  });
  const [gameResults, setGameResults] = useState<
    {
      winner: string | null;
      scores: { yellowScore: number; redScore: number };
      moves: any[];
    }[]
  >([]);

  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const scores = calculateScores(gameState.board);
    setGameState((prev) => ({
      ...prev,
      yellowScore: scores.yellowScore,
      redScore: scores.redScore,
    }));
  }, [gameState.board]);

  const saveGameToBackend = async (winner: string | null, moves: any[]) => {
    const saveEndpoint = `${API_URL}${
      API_URL.includes("vercel") ? "/save_game" : "/save_game/"
    }`;

    const boardStates = [
      initializeBoard(boardLayout),
      ...moves.map((_, i) => {
        let board = initializeBoard(boardLayout);
        for (let j = 0; j <= i; j++) {
          const { from, to } = moves[j];
          board = makeMove(board, from, to, j % 2 === 0 ? "yellow" : "red");
        }
        return board;
      }),
    ];

    const formattedMoves = moves.map((m) => ({
      from_pos: m.from,
      to_pos: m.to,
    }));

    try {
      await fetch(saveEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          board_states: boardStates,
          moves: formattedMoves,
          winner: winner || "draw",
        }),
      });
    } catch (err) {
      console.error("Error saving game:", err);
    }
  };

  const fetchBotMove = async (
    board: BoardState,
    current_player: Side,
    algorithm: string,
    iterations: number
  ) => {
    const endpoint = `${API_URL}${
      API_URL.includes("vercel") ? "/bot_move/" : "/bot_move"
    }`;
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ board, current_player, algorithm, iterations }),
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      return data;
    } catch (err) {
      console.error(`Error fetching bot move:`, err);
      return null;
    }
  };

  const handleStartBot = async () => {
    if (numGames < 1) return;
    resetGameState();
    setIsPlayingBotVsBot(true);

    const newResults = [];

    for (let i = 0; i < numGames; i++) {
      let tempBoard = initializeBoard(boardLayout);
      let currentPlayer: Side = "yellow";
      let moves: { from: Position; to: Position }[] = [];
      let gameOver = false;

      while (!gameOver) {
        const validMoves = getAllValidMoves(tempBoard, currentPlayer);
        if (validMoves.length === 0) {
          currentPlayer = currentPlayer === "yellow" ? "red" : "yellow";
          continue;
        }

        const moveData = await fetchBotMove(
          tempBoard,
          currentPlayer,
          algorithm[currentPlayer],
          iterations[currentPlayer]
        );

        if (!moveData) {
          console.error("Error fetching bot move");
          break;
        }

        if (moveData) {
          const { from, to } = moveData.move;
          tempBoard = makeMove(tempBoard, from, to, moveData.current_player);
          moves.push({ from, to });
          currentPlayer = moveData.current_player === "yellow" ? "red" : "yellow";

          setGameState((prev) => ({
            ...prev,
            board: tempBoard,
            currentPlayer,
          }));

          setMoveHistory((prev) => [...prev, { from, to }]);
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }

        gameOver = checkGameOver(tempBoard);
      }

      const winner = determineWinner(tempBoard);
      const scores = calculateScores(tempBoard);
      newResults.push({
        winner,
        scores: {
          yellowScore: scores.yellowScore,
          redScore: scores.redScore,
        },
        moves,
      });
    }

    setGameResults(newResults);
    updateScoreboard(newResults);
    setIsPlayingBotVsBot(false);
  };

  const handleMove = (from: Position, to: Position) => {
    if (gameType !== "multi" || gameState.gameOver) return;

    if (isValidMove(gameState.board, from, to, gameState.currentPlayer)) {
      const newBoard = makeMove(
        gameState.board,
        from,
        to,
        gameState.currentPlayer
      );
      const nextPlayer =
        gameState.currentPlayer === "yellow" ? "red" : "yellow";

      setGameState((prev) => ({
        ...prev,
        board: newBoard,
        currentPlayer: nextPlayer,
      }));
      setMoveHistory((prev) => [...prev, { from, to }]);
    }
  };

  useEffect(() => {
    if (gameType !== "multi" || gameState.gameOver) return;

    if (checkGameOver(gameState.board)) {
      const winner = determineWinner(gameState.board);
      setGameState((prev) => ({ ...prev, gameOver: true, winner }));
      setShowGameOver(true);
      saveGameToBackend(winner, moveHistory);
    }
  }, [gameState.board]);

  useEffect(() => {
    if (gameType !== "multi" || gameState.gameOver) return;
    if (!hasValidMoves(gameState.board, gameState.currentPlayer)) {
      const nextPlayer =
        gameState.currentPlayer === "yellow" ? "red" : "yellow";
      setGameState((prev) => ({ ...prev, currentPlayer: nextPlayer }));
    }
  }, [gameState.board, gameState.currentPlayer]);

  const resetGameState = () => {
    setGameState({
      board: initializeBoard(boardLayout),
      currentPlayer: "yellow",
      yellowScore: 0,
      redScore: 0,
      gameOver: false,
      winner: null,
    });
    setMoveHistory([]);
    setShowGameOver(false);
    setGameResults([]);
    setScoreboard({ yellowWins: 0, redWins: 0, draws: 0 });
    setIsPlayingBotVsBot(false);
  };

  const handleRestart = () => resetGameState();
  const handleBack = () => navigate("/setup");

  const updateScoreboard = (results: { winner: string | null }[]) => {
    const newScoreboard = { yellowWins: 0, redWins: 0, draws: 0 };
    results.forEach((r) => {
      if (r.winner === "yellow") newScoreboard.yellowWins++;
      else if (r.winner === "red") newScoreboard.redWins++;
      else newScoreboard.draws++;
    });
    setScoreboard(newScoreboard);
  };

  return (
    <div className="flex flex-row justify-center min-h-screen bg-green-700 gap-10">
      {/* Bảng game bên trái */}
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        {showGameOver && (
          <Notification
            title="Game Over"
            description={`Winner: ${gameState.winner || "Draw"}`}
            variant="default"
            onClose={() => setShowGameOver(false)}
          />
        )}
        <div className="flex flex-row justify-between text-white text-xl mb-4 w-full max-w-md">
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
              <AvatarFallback className="bg-red-500 text-white">
                R
              </AvatarFallback>
            </Avatar>
            <span>Red Score: {gameState.redScore}</span>
          </div>
        </div>
        <div className="flex text-white items-center space-x-3 space-y-3">
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
        <Board
          board={gameState.board}
          currentPlayer={gameState.currentPlayer}
          onMove={handleMove}
          gameType={gameType}
          playerSide={playerSide}
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

      {/* Settings bên phải cho chế độ bot-vs-bot */}
      {gameType === "bot-vs-bot" && (
        <div className="flex flex-col ml-8 p-4 text-white rounded-lg w-64 justify-center items-center">
          <h3 className="text-lg font-bold mb-4">Settings</h3>
          <div className="flex flex-row justify-center items-center gap-5 w-full">
            <BotSettings
              botName="Yellow Bot"
              color="yellow"
              algoKey="yellow"
              algorithm={algorithm}
              setAlgorithm={setAlgorithm}
              iterations={iterations}
              setIterations={setIterations}
            />
            <BotSettings
              botName="Red Bot"
              color="red"
              algoKey="red"
              algorithm={algorithm}
              setAlgorithm={setAlgorithm}
              iterations={iterations}
              setIterations={setIterations}
            />
          </div>

          <div className="w-full mb-4">
            <label className="block mb-1">Number of Games:</label>
            <Input
              type="number"
              value={numGames}
              onChange={(e) =>
                setNumGames(Math.max(1, parseInt(e.target.value) || 1))
              }
              min={1}
              className="w-full bg-gray-700 text-white"
            />
          </div>

          <Button
            onClick={handleStartBot}
            disabled={isPlayingBotVsBot}
            className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
          >
            {isPlayingBotVsBot ? "Playing..." : "Start"}
          </Button>

          {gameResults.length > 0 && (
            <div className="mt-4">
              <h4 className="text-md font-semibold mb-2">Game Results:</h4>
              <ul className="space-y-2">
                {gameResults.map((result, index) => (
                  <li key={index} className="text-sm">
                    Game {index + 1}: {result.winner} (Yellow:{" "}
                    {result.scores.yellowScore}, Red: {result.scores.redScore})
                  </li>
                ))}
              </ul>

              <div className="mt-4">
                <h4 className="text-md font-semibold mb-2">Scoreboard:</h4>
                <div className="bg-gray-700 p-3 rounded">
                  <p>Yellow Wins: {scoreboard.yellowWins}</p>
                  <p>Red Wins: {scoreboard.redWins}</p>
                  <p>Draws: {scoreboard.draws}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GameScreen;
