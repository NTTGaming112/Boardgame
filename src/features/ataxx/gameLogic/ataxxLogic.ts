// src/features/ataxx/gameLogic/ataxxLogic.ts
import { BoardState, CellState, Position, GameState, Side } from "../types";
import { layouts } from "../maps";

const BOARD_SIZE = 7;

// Khởi tạo bàn cờ dựa trên layoutId
export const initializeBoard = (layoutId: number): BoardState => {
  const layout = layouts[layoutId];
  if (!layout) {
    throw new Error(`Invalid layout ID: ${layoutId}`);
  }
  // Tạo bản sao của layout để không thay đổi layout gốc
  return layout.map((row) => [...row]);
};

// Tính điểm
export const calculateScores = (
  board: BoardState
): { yellowScore: number; redScore: number } => {
  let yellowScore = 0;
  let redScore = 0;

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (board[row][col] === "yellow") yellowScore++;
      if (board[row][col] === "red") redScore++;
    }
  }

  return { yellowScore, redScore };
};

// Kiểm tra nước đi hợp lệ (hình vuông bán kính 2)
export const isValidMove = (
  board: BoardState,
  from: Position,
  to: Position,
  currentPlayer: Side
): boolean => {
  const { row: fromRow, col: fromCol } = from;
  const { row: toRow, col: toCol } = to;

  if (board[fromRow][fromCol] !== currentPlayer) return false;
  if (board[toRow][toCol] !== "empty") return false;

  const rowDiff = Math.abs(fromRow - toRow);
  const colDiff = Math.abs(fromCol - toCol);
  if (rowDiff > 2 || colDiff > 2) return false;

  if (toRow < 0 || toRow >= BOARD_SIZE || toCol < 0 || toCol >= BOARD_SIZE)
    return false;

  return true;
};

// Tìm tất cả các nước đi hợp lệ từ một vị trí
export const getValidMoves = (
  board: BoardState,
  from: Position,
  currentPlayer: Side
): Position[] => {
  const validMoves: Position[] = [];
  const { row: fromRow, col: fromCol } = from;

  const minRow = Math.max(0, fromRow - 2);
  const maxRow = Math.min(BOARD_SIZE - 1, fromRow + 2);
  const minCol = Math.max(0, fromCol - 2);
  const maxCol = Math.min(BOARD_SIZE - 1, fromCol + 2);

  for (let toRow = minRow; toRow <= maxRow; toRow++) {
    for (let toCol = minCol; toCol <= maxCol; toCol++) {
      const to = { row: toRow, col: toCol };
      if (isValidMove(board, from, to, currentPlayer)) {
        validMoves.push(to);
      }
    }
  }

  return validMoves;
};

// Chuyển đổi các quân cờ lân cận
export const captureNeighbors = (
  board: BoardState,
  to: Position,
  currentPlayer: Side
): BoardState => {
  const newBoard = board.map((row) => [...row]);
  const { row: toRow, col: toCol } = to;

  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = toRow + dr;
      const nc = toCol + dc;

      if (
        nr >= 0 &&
        nr < BOARD_SIZE &&
        nc >= 0 &&
        nc < BOARD_SIZE &&
        (newBoard[nr][nc] === "yellow" || newBoard[nr][nc] === "red")
      ) {
        newBoard[nr][nc] = currentPlayer;
      }
    }
  }

  return newBoard;
};

// Thực hiện nước đi
export const makeMove = (
    board: BoardState,
    from: Position,
    to: Position,
    currentPlayer: Side
): BoardState => {
    const newBoard = board.map((row) => [...row]);
    const { row: fromRow, col: fromCol } = from;
    const { row: toRow, col: toCol } = to;

    const rowDiff = Math.abs(fromRow - toRow);
    const colDiff = Math.abs(fromCol - toCol);

    if (rowDiff <= 1 && colDiff <= 1) {
        // Nếu chọn ô trong bán kính hình vuông là 1 thì nhân bản
        newBoard[toRow][toCol] = currentPlayer;
    } else {
        // Nếu lớn hơn 1 thì di chuyển
        newBoard[fromRow][fromCol] = "empty";
        newBoard[toRow][toCol] = currentPlayer;
    }

    return captureNeighbors(newBoard, to, currentPlayer);
};

// Kiểm tra game kết thúc
export const checkGameOver = (board: BoardState): boolean => {
  const scores = calculateScores(board);
  if (scores.yellowScore === 0 || scores.redScore === 0) return true;

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (board[row][col] === "empty") return false;
    }
  }
  return true;
};

// Tìm người thắng
export const determineWinner = (board: BoardState): Side | null => {
  const { yellowScore, redScore } = calculateScores(board);
  if (yellowScore > redScore) return "yellow";
  if (redScore > yellowScore) return "red";
  return null;
};
