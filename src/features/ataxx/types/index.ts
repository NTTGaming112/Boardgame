export interface BoardLayout {
  id: number;
  pattern: string;
}

export type Side = "yellow" | "red";
export type GameType = "single" | "multi" | "bot-vs-bot";

// Trạng thái ô trên bàn cờ
export type CellState = "yellow" | "red" | "empty" | "block";

// Trạng thái bàn cờ
export type BoardState = CellState[][];

// Vị trí ô trên bàn cờ
export interface Position {
  row: number;
  col: number;
}

// Trạng thái game
export interface GameState {
  board: BoardState;
  currentPlayer: Side;
  yellowScore: number;
  redScore: number;
  gameOver: boolean;
  winner: Side | null;
}