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
} from "../gameLogic/ataxxLogic";
import { GameState, Side, Position } from "../types";
import { Input } from "@/ui/input";
import BotSettings from "../components/BotSetting";

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
    yellow: "mcts",
    red: "mcts",
  });
  const [iterations, setIterations] = useState<{ yellow: number; red: number }>(
    {
      yellow: 300,
      red: 300,
    }
  );
  const [isPlayingBotVsBot, setIsPlayingBotVsBot] = useState(false);
  const [scoreboard, setScoreboard] = useState<{
    yellowWins: number;
    redWins: number;
    draws: number;
  }>({
    yellowWins: 0,
    redWins: 0,
    draws: 0,
  });
  const [gameResults, setGameResults] = useState<
    {
      winner: string;
      scores: { yellowScore: number; redScore: number };
      moves: any[];
    }[]
  >([]);

  const API_URL = import.meta.env.VITE_API_URL;

  // Tính điểm
  useEffect(() => {
    const scores = calculateScores(gameState.board);
    setGameState((prev) => ({
      ...prev,
      yellowScore: scores.yellowScore,
      redScore: scores.redScore,
    }));
  }, [gameState.board]);

  // Hàm lưu game vào backend
  const saveGameToBackend = async (winner: string | null) => {
    const saveEndpoint = `${API_URL}${
      API_URL.includes("vercel") ? "/save_game" : "/save_game/"
    }`;

    const boardStates = [
      initializeBoard(boardLayout),
      ...moveHistory.map((_, i) => {
        let board = initializeBoard(boardLayout);
        for (let j = 0; j <= i; j++) {
          const { from, to } = moveHistory[j];
          board = makeMove(board, from, to, j % 2 === 0 ? "yellow" : "red");
        }
        return board;
      }),
    ];

    const moves = moveHistory.map((m) => ({
      from_pos: m.from,
      to_pos: m.to,
    }));

    try {
      const response = await fetch(saveEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          board_states: boardStates,
          moves,
          winner: winner || "draw",
        }),
      });
      const data = await response.json();
      console.log("Save game response:", data);
    } catch (err) {
      console.error("Error saving game:", err);
    }
  };

  // Hàm gọi API play_bot_vs_bot
  const fetchBotVsBotGame = async () => {
    const endpoint = `${API_URL}${
      API_URL.includes("vercel") ? "/play_bot_vs_bot/" : "/play_bot_vs_bot"
    }`;

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          board: initializeBoard(boardLayout),
          yellow: {
            algorithm: algorithm.yellow,
            iterations: iterations.yellow,
          },
          red: {
            algorithm: algorithm.red,
            iterations: iterations.red,
          },
        }),
      });

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      return data;
    } catch (err) {
      console.error(`Error playing bot vs bot game:`, err);
      return null;
    }
  };

  // Khi kết thúc game
  useEffect(() => {
    if (checkGameOver(gameState.board)) {
      const winner = determineWinner(gameState.board);
      setGameState((prev) => ({
        ...prev,
        gameOver: true,
        winner,
      }));
      setShowGameOver(true);

      saveGameToBackend(winner);

      if (gameType === "bot-vs-bot") {
        setTimeout(() => {
          setGameState({
            board: initializeBoard(boardLayout),
            currentPlayer: "yellow",
            yellowScore: 0,
            redScore: 0,
            gameOver: false,
            winner: null,
          });
          setMoveHistory([]);
        }, 2000);
      }
    }
  }, [gameState.board]);

  // Kiểm tra và chuyển lượt nếu người chơi hiện tại không có nước đi hợp lệ
  useEffect(() => {
    if (gameState.gameOver) return;

    const currentPlayerHasMoves = hasValidMoves(
      gameState.board,
      gameState.currentPlayer
    );
    if (!currentPlayerHasMoves) {
      const nextPlayer =
        gameState.currentPlayer === "yellow" ? "red" : "yellow";
      setGameState((prev) => ({
        ...prev,
        currentPlayer: nextPlayer,
      }));
    }
  }, [gameState.board, gameState.currentPlayer, gameState.gameOver]);

  const handleMove = (from: Position, to: Position) => {
    if (gameState.gameOver) return;

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

  const handleRestart = () => {
    resetGameState();
  };

  const handleBack = () => navigate("/setup");

  const updateScoreboard = (results: { winner: string }[]) => {
    const newScoreboard = {
      yellowWins: 0,
      redWins: 0,
      draws: 0,
    };

    results.forEach((result) => {
      if (result.winner === "yellow") newScoreboard.yellowWins += 1;
      else if (result.winner === "red") newScoreboard.redWins += 1;
      else newScoreboard.draws += 1;
    });

    setScoreboard(newScoreboard);
  };

  const handleStartBotVsBot = async () => {
    if (numGames < 1) return;

    setIsPlayingBotVsBot(true);
    setGameResults([]);
    setScoreboard({ yellowWins: 0, redWins: 0, draws: 0 });

    try {
      const results: typeof gameResults = [];
      for (let i = 0; i < numGames; i++) {
        const result = await fetchBotVsBotGame();
        if (result) {
          results.push(result);
          setGameResults(results);
          updateScoreboard(results);
          setGameState((prev) => ({
            ...prev,
            board: result.board,
            yellowScore: result.scores.yellowScore,
            redScore: result.scores.redScore,
            gameOver: true,
            winner: result.winner,
          }));
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
      setShowGameOver(true);
    } catch (error) {
      console.error("Error in bot vs bot games:", error);
    } finally {
      setIsPlayingBotVsBot(false);
    }
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
          <div className="flex flex-row gap-5 w-full">
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
            onClick={handleStartBotVsBot}
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
