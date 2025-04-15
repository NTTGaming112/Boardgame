import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { routes } from "./routes";
import { useLocation } from "react-router-dom";
import GameScreen from "./features/ataxx/pages/GameScreen";

// Component trung gian để truyền state
const GameScreenWrapper = () => {
  const location = useLocation();
  const { boardLayout, playerSide, gameType } = location.state || {
    boardLayout: 1,
    playerSide: "yellow",
    gameType: "single",
  };

  return (
    <GameScreen
      boardLayout={boardLayout}
      playerSide={playerSide}
      gameType={gameType}
    />
  );
};

// Cập nhật routes để sử dụng GameScreenWrapper
const updatedRoutes = routes.map((route) =>
  route.path === "/game" ? { ...route, element: <GameScreenWrapper /> } : route
);

const router = createBrowserRouter(updatedRoutes);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
