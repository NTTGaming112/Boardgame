import { RadioGroup, RadioGroupItem } from "@/ui/radio-group";
import { Label } from "@/ui/label";
import { GameType } from "../types";

interface GameTypeSelectorProps {
  gameType: GameType;
  onGameTypeChange: (value: GameType) => void;
}

const GameTypeSelector: React.FC<GameTypeSelectorProps> = ({
  gameType,
  onGameTypeChange,
}) => {
  return (
    <div>
      <h2 className="text-center font-semibold mb-2">Select Type</h2>
      <RadioGroup
        value={gameType}
        onValueChange={onGameTypeChange}
        className="flex justify-center space-x-4"
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="single" id="single" />
          <Label htmlFor="single">
            <div className="flex items-center space-x-1">
              <span className="text-2xl">👤</span>
              <span className="text-2xl">💻</span>
            </div>
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="multi" id="multi" />
          <Label htmlFor="multi">
            <div className="flex items-center space-x-1">
              <span className="text-2xl">👥</span>
            </div>
          </Label>
        </div>
      </RadioGroup>
    </div>
  );
};

export default GameTypeSelector;
