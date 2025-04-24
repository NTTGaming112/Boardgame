import { useState } from "react";
import { BoardState, Position, Side } from "../types";
import { getValidMoves } from "../gameLogic/ataxxLogic";

interface BoardProps {
  board: BoardState;
  currentPlayer: Side;
  onMove: (from: Position, to: Position) => void;
  gameType: "multi" | "bot-vs-bot";
  playerSide: Side;
}

const Board: React.FC<BoardProps> = ({
  board,
  currentPlayer,
  onMove,
  playerSide,
}) => {
  const [selected, setSelected] = useState<Position | null>(null);
  const [validMoves, setValidMoves] = useState<Position[]>([]);

  const handleCellClick = (row: number, col: number) => {
    const clickedPosition = { row, col };
    const cell = board[row][col];

    if (selected) {
      const isValid = validMoves.some(
        (move) => move.row === row && move.col === col
      );
      if (isValid) {
        const from = selected;
        const to = clickedPosition;
        onMove(from, to);
      }
      setSelected(null);
      setValidMoves([]);
    } else {
      if (cell === currentPlayer) {
        setSelected(clickedPosition);
        const moves = getValidMoves(board, clickedPosition, currentPlayer);
        setValidMoves(moves);
      }
    }
  };

  const isValidMoveCell = (row: number, col: number): boolean => {
    return validMoves.some((move) => move.row === row && move.col === col);
  };

  return (
    <div className="grid gap-1 bg-gray-800 p-2 rounded-lg">
      {board.map((row, rowIndex) => (
        <div key={rowIndex} className="flex gap-1">
          {row.map((cell, colIndex) => {
            const isBotCell =
              currentPlayer === playerSide &&
              cell === (playerSide === "yellow" ? "red" : "yellow");

            return (
              <div
                key={`${rowIndex}-${colIndex}`}
                onClick={() => handleCellClick(rowIndex, colIndex)}
                className={`w-12 h-12 flex items-center justify-center border-2 rounded
                  ${cell === "empty" ? "bg-gray-300" : ""}
                  ${cell === "yellow" ? "bg-yellow-400" : ""}
                  ${cell === "red" ? "bg-red-500" : ""}
                  ${cell === "block" ? "bg-black" : ""}
                  ${
                    selected?.row === rowIndex && selected?.col === colIndex
                      ? "border-blue-500"
                      : ""
                  }
                  ${
                    isValidMoveCell(rowIndex, colIndex)
                      ? "border-green-500 animate-pulse"
                      : "border-gray-500"
                  }
                  ${isBotCell ? "cursor-not-allowed" : "cursor-pointer"}`}
              >
                {cell === "block" && <span className="text-white">X</span>}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default Board;
