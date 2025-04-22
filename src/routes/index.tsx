import { RouteObject } from "react-router-dom";
import HomeScreen from "../features/ataxx/pages/HomeScreen";
import SetupScreen from "../features/ataxx/pages/SetupScreen";
import GameScreen from "../features/ataxx/pages/GameScreen";

export const routes: RouteObject[] = [
  {
    path: "/",
    element: <HomeScreen />,
  },
  {
    path: "/setup",
    element: <SetupScreen />,
  },
  
  {
    path: "/game",
    element: (
      <GameScreen boardLayout={1} playerSide="yellow" gameType="multi" />
    ),
  },
];
