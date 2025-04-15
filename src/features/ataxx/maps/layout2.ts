import { BoardState } from "../types";

const BOARD_SIZE = 7;

export const layout2: BoardState = Array(BOARD_SIZE)
  .fill(null)
  .map(() => Array(BOARD_SIZE).fill("empty"));

layout2[0][0] = "yellow";
layout2[0][BOARD_SIZE - 1] = "red";
layout2[BOARD_SIZE - 1][0] = "red";
layout2[BOARD_SIZE - 1][BOARD_SIZE - 1] = "yellow";

// Các ô chặn (ví dụ: 4 ô chặn tạo hình chữ X)
layout2[2][2] = "block";
layout2[2][4] = "block";
layout2[4][2] = "block";
layout2[4][4] = "block";
