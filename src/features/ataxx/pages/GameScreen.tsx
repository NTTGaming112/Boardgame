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
import { GameState, Side, Position } from "../types";

interface GameScreenProps {
  boardLayout: number;
  playerSide: Side;
  gameType: "single" | "multi" | "bot-vs-bot";
}

const GameScreen: React.FC<GameScreenProps> = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Lấy thông tin từ SetupScreen.tsx
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

  // API URL từ biến môi trường (local hoặc production)
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

  // Cập nhật điểm số mỗi khi board thay đổi
  useEffect(() => {
    const scores = calculateScores(gameState.board);
    setGameState((prev) => ({
      ...prev,
      yellowScore: scores.yellowScore,
      redScore: scores.redScore,
    }));
  }, [gameState.board]);

  // Kiểm tra game kết thúc và lưu ván chơi lên backend
  useEffect(() => {
    if (checkGameOver(gameState.board)) {
      const winner = determineWinner(gameState.board);
      setGameState((prev) => ({
        ...prev,
        gameOver: true,
        winner,
      }));
      setShowGameOver(true);

      // Gửi dữ liệu ván chơi lên backend
      fetch(
        `${API_URL}${
          API_URL.includes("cloudfunctions") ? "/save_game" : "/games/"
        }`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            board_states: [
              initializeBoard(boardLayout),
              ...moveHistory.map((_, i) => {
                let board = initializeBoard(boardLayout);
                for (let j = 0; j <= i; j++) {
                  const { from, to } = moveHistory[j];
                  board = makeMove(
                    board,
                    from,
                    to,
                    j % 2 === 0 ? "yellow" : "red"
                  );
                }
                return board;
              }),
            ],
            moves: moveHistory.map((m) => ({ from_pos: m.from, to_pos: m.to })),
            winner: winner || "draw",
          }),
        }
      ).catch((err) => console.error("Error saving game:", err));

      if (gameType === "bot-vs-bot") {
        // Restart game for bot-vs-bot
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
        }
          , 2000); // Delay 2 seconds before restarting
      }
    }
  }, [gameState.board]);

  // Logic gọi API để lấy nước đi từ bot trong chế độ single player
  useEffect(() => {
    if (
      gameType === "single" &&
      !gameState.gameOver &&
      gameState.currentPlayer !== playerSide
    ) {
      console.log("Bot's turn to move");
      const botPlayer = playerSide === "yellow" ? "red" : "yellow";
      setTimeout(async () => {
        try {
          const response = await fetch(
            `${API_URL}${
              API_URL.includes("cloudfunctions")
                ? "/get_bot_move"
                : "/bot-move/"
            }`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                board: gameState.board,
                current_player: botPlayer,
              }),
            }
          );
          const data = await response.json();
          let move;
          if (API_URL.includes("cloudfunctions")) {
            if (data.statusCode !== 200) {
              throw new Error(data.body);
            }
            move = data.body;
          } else {
            move = data;
          }
          if (move) {
            handleMove(move.from, move.to);
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        } catch (err) {
          console.error("Error getting bot move:", err);
        }
      }, 500);
    }
  }, [gameState.currentPlayer, gameState.gameOver]);

  // Logic call api bot-vs-bot
  useEffect(() => {
    if (gameType === "bot-vs-bot" && !gameState.gameOver) {
      const botPlayer = gameState.currentPlayer;

      const timeout = setTimeout(async () => {
        try {
          const response = await fetch(
            `${API_URL}${
              API_URL.includes("cloudfunctions")
                ? "/get_bot_move"
                : "/bot-move/"
            }`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                board: gameState.board,
                current_player: botPlayer,
              }),
            }
          );

          const data = await response.json();

          let move;
          if (API_URL.includes("cloudfunctions")) {
            if (data.statusCode !== 200) {
              throw new Error(data.body);
            }
            move = data.body;
          } else {
            move = data;
          }

          if (move) {
            handleMove(move.from, move.to);
          }
        } catch (err) {
          console.error(`Error getting ${botPlayer} bot move:`, err);
        }
      }, 600); // Delay giữa mỗi lượt bot, có thể chỉnh

      return () => clearTimeout(timeout);
    }
  }, [gameState.currentPlayer, gameState.board, gameState.gameOver, gameType]);


  const handleMove = (from: Position, to: Position) => {
    if (gameState.gameOver) return;

    // Kiểm tra nếu đang ở chế độ single player và đến lượt người chơi
    if (gameType === "single" && gameState.currentPlayer === playerSide) {
      // Chỉ cho phép di chuyển ô của playerSide
      if (gameState.board[from.row][from.col] !== playerSide) {
        console.log(`You can only move your own pieces (${playerSide})!`);
        return;
      }
    }

    // Kiểm tra nước đi hợp lệ và thực hiện di chuyển
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
      // Lưu nước đi vào moveHistory
      setMoveHistory((prev) => [...prev, { from, to }]);
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
    setMoveHistory([]); // Reset moveHistory
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
            <AvatarFallback className="bg-red-500 text-white">R</AvatarFallback>
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
  );
};

export default GameScreen;
