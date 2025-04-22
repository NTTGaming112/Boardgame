import { BoardState, Position, Side } from "../types";
import { layouts } from "../maps";

const BOARD_SIZE = 7;
const MAX_MOVE_DISTANCE = 2;
const NEIGHBOR_OFFSETS = [
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, -1],
  [0, 1],
  [1, -1],
  [1, 0],
  [1, 1],
] as const;

// Khởi tạo bàn cờ dựa trên layoutId
export const initializeBoard = (layoutId: number): BoardState => {
  const layout = layouts[layoutId];
  if (!layout) {
    throw new Error(`Invalid layout ID: ${layoutId}`);
  }
  return layout.map((row) => [...row]);
};

// Tính điểm cho cả hai bên
export const calculateScores = (
  board: BoardState
): { yellowScore: number; redScore: number } => {
  let yellowScore = 0;
  let redScore = 0;

  for (const row of board) {
    for (const cell of row) {
      if (cell === "yellow") yellowScore++;
      else if (cell === "red") redScore++;
    }
  }

  return { yellowScore, redScore };
};

// Kiểm tra xem vị trí có hợp lệ trên bàn cờ không
const isValidPosition = (row: number, col: number): boolean =>
  row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;

// Kiểm tra nước đi hợp lệ (hình vuông bán kính 2)
export const isValidMove = (
  board: BoardState,
  from: Position,
  to: Position,
  currentPlayer: Side
): boolean => {
  const { row: fromRow, col: fromCol } = from;
  const { row: toRow, col: toCol } = to;

  // Kiểm tra vị trí nguồn và đích
  if (
    board[fromRow][fromCol] !== currentPlayer ||
    board[toRow][toCol] !== "empty"
  ) {
    return false;
  }

  // Kiểm tra khoảng cách (bán kính 2)
  const rowDiff = Math.abs(fromRow - toRow);
  const colDiff = Math.abs(fromCol - toCol);
  if (rowDiff > MAX_MOVE_DISTANCE || colDiff > MAX_MOVE_DISTANCE) {
    return false;
  }

  // Kiểm tra vị trí đích có nằm trong bàn cờ không
  return isValidPosition(toRow, toCol);
};

// Tìm tất cả các nước đi hợp lệ từ một vị trí
export const getValidMoves = (
  board: BoardState,
  from: Position,
  currentPlayer: Side
): Position[] => {
  const { row: fromRow, col: fromCol } = from;
  const validMoves: Position[] = [];

  const minRow = Math.max(0, fromRow - MAX_MOVE_DISTANCE);
  const maxRow = Math.min(BOARD_SIZE - 1, fromRow + MAX_MOVE_DISTANCE);
  const minCol = Math.max(0, fromCol - MAX_MOVE_DISTANCE);
  const maxCol = Math.min(BOARD_SIZE - 1, fromCol + MAX_MOVE_DISTANCE);

  for (let toRow = minRow; toRow <= maxRow; toRow++) {
    for (let toCol = minCol; toCol <= maxCol; toCol++) {
      const to: Position = { row: toRow, col: toCol };
      if (isValidMove(board, from, to, currentPlayer)) {
        validMoves.push(to);
      }
    }
  }

  return validMoves;
};

// Chuyển đổi các quân cờ lân cận thành màu của người chơi
export const captureNeighbors = (
  board: BoardState,
  to: Position,
  currentPlayer: Side
): BoardState => {
  const newBoard = board.map((row) => [...row]);
  const { row: toRow, col: toCol } = to;

  for (const [dr, dc] of NEIGHBOR_OFFSETS) {
    const nr = toRow + dr;
    const nc = toCol + dc;

    if (
      isValidPosition(nr, nc) &&
      (newBoard[nr][nc] === "yellow" || newBoard[nr][nc] === "red")
    ) {
      newBoard[nr][nc] = currentPlayer;
    }
  }

  return newBoard;
};

// Thực hiện nước đi (nhân bản hoặc di chuyển)
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

  // Nhân bản nếu ô đích trong bán kính 1, di chuyển nếu trong bán kính 2
  if (rowDiff <= 1 && colDiff <= 1) {
    newBoard[toRow][toCol] = currentPlayer;
  } else {
    newBoard[fromRow][fromCol] = "empty";
    newBoard[toRow][toCol] = currentPlayer;
  }

  return captureNeighbors(newBoard, to, currentPlayer);
};

// Kiểm tra xem còn nước đi hợp lệ nào cho một người chơi không
export const hasValidMoves = (board: BoardState, player: Side): boolean => {
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (board[row][col] === player) {
        const position: Position = { row, col };
        const validMoves = getValidMoves(board, position, player);
        if (validMoves.length > 0) return true;
      }
    }
  }
  return false;
};

// Kiểm tra xem bàn cờ có đầy không
export const isBoardFull = (board: BoardState): boolean => {
  return board.every((row) => row.every((cell) => cell !== "empty"));
};

// Kiểm tra game kết thúc
export const checkGameOver = (board: BoardState): boolean => {
  const { yellowScore, redScore } = calculateScores(board);
  return (
    isBoardFull(board) ||
    (!hasValidMoves(board, "yellow") && !hasValidMoves(board, "red")) ||
    (yellowScore === 0 || redScore === 0)
  );
};

// Xác định người thắng
export const determineWinner = (board: BoardState): Side | null => {
  const { yellowScore, redScore } = calculateScores(board);
  if (yellowScore > redScore) return "yellow";
  if (redScore > yellowScore) return "red";
  return null;
};
