import { Button } from "@/ui/button";
import { useNavigate } from "react-router-dom";

const HomeScreen: React.FC = () => {
  const navigate = useNavigate();

  const handleStart = () => {
    navigate("/setup");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-green-700 p-4">
      <h1 className="text-white text-4xl mb-8">Welcome to Ataxx</h1>
      <Button
        onClick={handleStart}
        className="bg-yellow-600 hover:bg-yellow-700 text-white text-lg px-6 py-3"
      >
        Start Game
      </Button>
    </div>
  );
};

export default HomeScreen;
