import { BoardState } from "../types";

const BOARD_SIZE = 7;

export const layout1: BoardState = Array(BOARD_SIZE)
  .fill(null)
  .map(() => Array(BOARD_SIZE).fill("empty"));

layout1[0][0] = "yellow"; // Góc trên trái: Yellow
layout1[0][BOARD_SIZE - 1] = "red"; // Góc trên phải: Red
layout1[BOARD_SIZE - 1][0] = "red"; // Góc dưới trái: Red
layout1[BOARD_SIZE - 1][BOARD_SIZE - 1] = "yellow"; // Góc dưới phải: Yellow
