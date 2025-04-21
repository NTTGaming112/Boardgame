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
} from "../gameLogic/ataxxLogic";
import { GameState, Side, Position, BoardState } from "../types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";
import { Input } from "@/ui/input";

interface GameScreenProps {
  boardLayout: number;
  playerSide: Side;
  gameType: "single" | "multi" | "bot-vs-bot";
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
  const [algorithm, setAlgorithm] = useState<string>("mcts"); // Mặc định là MCTS
  const [iterations, setIterations] = useState<number>(300); // Số lượng mô phỏng
  const [numGames, setNumGames] = useState<number>(1); // Số ván chơi
  const [isPlayingBotVsBot, setIsPlayingBotVsBot] = useState(false);
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

  // Hàm gọi API bot move
  const fetchBotMove = async (board: BoardState, currentPlayer: Side) => {
    try {
      const endpoint = `${API_URL}${
        API_URL.includes("vercel") ? "/bot-move/" : "/get_bot_move"
      }`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          board,
          current_player: currentPlayer,
          iterations,
        }),
      });

      const data = await response.json();
      console.log("Bot move data:", data);
      return API_URL.includes("vercel") ? data : data.body;
    } catch (err) {
      console.error(`Error getting bot move:`, err);
      return null;
    }
  };

  // Hàm gọi API play_bot_vs_bot
  const fetchBotVsBotGame = async () => {
    try {
      const endpoint = `${API_URL}${
        API_URL.includes("vercel") ? "/play_bot_vs_bot/" : "/play_bot_vs_bot"
      }`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          board: initializeBoard(boardLayout),
          iterations,
          algorithm,
        }),
      });

      const data = await response.json();
      console.log("Bot vs Bot game result:", data);
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

      fetch(saveEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          board_states: boardStates,
          moves,
          winner: winner || "draw",
        }),
      })
        .then((response) => response.json())
        .then((data) => console.log("Save game response:", data))
        .catch((err) => console.error("Error saving game:", err));

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

  // Bot move cho chế độ single
  // useEffect(() => {
  //   if (
  //     gameType === "single" &&
  //     !gameState.gameOver &&
  //     gameState.currentPlayer !== playerSide
  //   ) {
  //     const botPlayer = playerSide === "yellow" ? "red" : "yellow";
  //     setTimeout(async () => {
  //       const move = await fetchBotMove(gameState.board, botPlayer);
  //       if (move) {
  //         handleMove(move.from, move.to);
  //         await new Promise((r) => setTimeout(r, 1000));
  //       }
  //     }, 500);
  //   }
  // }, [gameState.currentPlayer, gameState.gameOver]);

  // Bot-vs-bot tự chơi
  // useEffect(() => {
  //   if (gameType === "bot-vs-bot" && !gameState.gameOver) {
  //     const botPlayer = gameState.currentPlayer;
  //     const timeout = setTimeout(async () => {
  //       const move = await fetchBotMove(gameState.board, botPlayer);
  //       if (move) handleMove(move.from, move.to);
  //     }, 600);

  //     return () => clearTimeout(timeout);
  //   }
  // }, [gameState.currentPlayer, gameState.board, gameState.gameOver, gameType]);

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
      setMoveHistory((prev) => [...prev, { from, to }]);
    }
  };

  const handleTrain = () => {
    console.log("Training bot...");
    const endpoint = `${API_URL}${
      API_URL.includes("vercel") ? "/train_mcts" : "/train_mcts_route/"
    }`;

    fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    })
      .then((response) => response.json())
      .then((data) => console.log("Training response:", data))
      .catch((error) => console.error("Error training bot:", error));
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
    setMoveHistory([]);
    setShowGameOver(false);
  };

  const handleBack = () => navigate("/setup");

  const handleStartBotVsBot = async () => {
    setIsPlayingBotVsBot(true);
    setGameResults([]);
    try {
      for (let i = 0; i < numGames; i++) {
        const result = await fetchBotVsBotGame();
        if (result) {
          setGameResults((prev) => [...prev, result]);
          setGameState((prev) => ({
            ...prev,
            board: result.board,
            yellowScore: result.scores.yellowScore,
            redScore: result.scores.redScore,
            gameOver: true,
            winner: result.winner,
          }));
          setShowGameOver(true);
          await new Promise((resolve) => setTimeout(resolve, 2000)); // Đợi 2 giây trước khi chơi ván tiếp theo
        }
      }
    } catch (error) {
      console.error("Error in bot vs bot games:", error);
    } finally {
      setIsPlayingBotVsBot(false);
    }
  };

  return (
    <div className="flex flex-row justify-center min-h-screen bg-green-700 gap-10">
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
      {gameType === "bot-vs-bot" && (
        <div className="flex flex-col ml-8 p-4 text-white rounded-lg w-64 justify-center items-center">
          <h3 className="text-lg font-bold mb-4">Settings</h3>

          {/* Chọn thuật toán */}
          <div className="mb-4">
            <label className="block mb-1">Algorithm:</label>
            <Select
              onValueChange={(value) => setAlgorithm(value)}
              defaultValue="mcts"
            >
              <SelectTrigger className="w-full bg-gray-700 text-white">
                <SelectValue placeholder="Select algorithm" />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 text-white">
                <SelectItem value="mcts">MCTS</SelectItem>
                <SelectItem value="random">Random</SelectItem>
                {/* Có thể thêm các thuật toán khác nếu backend hỗ trợ */}
              </SelectContent>
            </Select>
          </div>

          {/* Nhập số lượng mô phỏng */}
          <div className="mb-4">
            <label className="block mb-1">Number of Simulations:</label>
            <Input
              type="number"
              value={iterations}
              onChange={(e) =>
                setIterations(Math.max(1, parseInt(e.target.value) || 300))
              }
              min={1}
              className="w-full bg-gray-700 text-white"
            />
          </div>

          {/* Nhập số lượng ván chơi */}
          <div className="mb-4">
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

          {/* Nút Start */}
          <Button
            onClick={handleStartBotVsBot}
            disabled={isPlayingBotVsBot}
            className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
          >
            {isPlayingBotVsBot ? "Playing..." : "Start"}
          </Button>

          {/* Hiển thị kết quả các ván */}
          {gameResults.length >= 0 && (
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
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GameScreen;
