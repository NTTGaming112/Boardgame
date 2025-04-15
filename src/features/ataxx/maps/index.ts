import { BoardState } from "../types";
import { layout1 } from "./layout1";
import { layout2 } from "./layout2";

export const layouts: Record<number, BoardState> = {
  1: layout1,
  2: layout2,
};
