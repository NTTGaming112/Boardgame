import { useState } from "react";
import { Button } from "@/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/ui/alert";
import BoardSelector from "../components/BoardSelector";
import SideSelector from "../components/SideSelector";
import GameTypeSelector from "../components/GameTypeSelector";
import { Side, GameType } from "../types";
import { useNavigate } from "react-router-dom";

const SetupScreen: React.FC = () => {
  const navigate = useNavigate();
  const [selectedBoard, setSelectedBoard] = useState<number | null>(null);
  const [selectedSide, setSelectedSide] = useState<Side>("yellow");
  const [gameType, setGameType] = useState<GameType>("multi");
  const [showAlert, setShowAlert] = useState(false); // State để hiển thị Alert

  const handleStartGame = () => {
    if (selectedBoard === null) {
      setShowAlert(true); // Hiển thị Alert nếu chưa chọn board
      return;
    }
    setShowAlert(false); // Ẩn Alert nếu đã chọn board
    navigate("/game", {
      state: {
        boardLayout: selectedBoard,
        playerSide: selectedSide,
        gameType,
      },
    });
  };

  const handleBack = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-green-700 p-4">
      {showAlert && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-full max-w-sm">
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>Please select a board!</AlertDescription>
            <div className="mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAlert(false)}
              >
                Close
              </Button>
            </div>
          </Alert>
        </div>
      )}
      <Card className="w-full max-w-md bg-green-800 text-white">
        <CardHeader>
          <CardTitle className="text-center text-xl">Ataxx Setup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <BoardSelector
            selectedBoard={selectedBoard}
            onBoardSelect={setSelectedBoard}
          />
          <SideSelector
            selectedSide={selectedSide}
            onSideChange={setSelectedSide}
          />
          <GameTypeSelector
            gameType={gameType}
            onGameTypeChange={setGameType}
          />
          <div className="flex justify-between">
            <Button
              onClick={handleBack}
              className="bg-gray-600 hover:bg-gray-700 text-white"
            >
              Back to Home
            </Button>
            <Button
              onClick={handleStartGame}
              className="bg-yellow-600 hover:bg-yellow-700 text-white"
            >
              ✓ Start Game
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SetupScreen;
