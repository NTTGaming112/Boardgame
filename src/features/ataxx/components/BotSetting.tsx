import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/select";
import { Input } from "@/ui/input";

interface BotSettingsProps {
  botName: string;
  color: string;
  algoKey: "yellow" | "red";
  algorithm: { yellow: string; red: string };
  setAlgorithm: React.Dispatch<
    React.SetStateAction<{ yellow: string; red: string }>
  >;
  iterations: { yellow: number; red: number };
  setIterations: React.Dispatch<
    React.SetStateAction<{ yellow: number; red: number }>
  >;
}

const BotSettings: React.FC<BotSettingsProps> = ({
  botName,
  color,
  algoKey,
  algorithm,
  setAlgorithm,
  iterations,
  setIterations,
}) => (
  <div className="w-full mb-4">
    <h4 className={`text-md font-semibold mb-2 text-${color}-400`}>
      {botName}
    </h4>
    <div className="mb-2">
      <label className="block mb-1">Algorithm:</label>
      <Select
        onValueChange={(value) =>
          setAlgorithm((prev) => ({ ...prev, [algoKey]: value }))
        }
        defaultValue="mcts-binary"
      >
        <SelectTrigger className="w-full bg-gray-700 text-white">
          <SelectValue placeholder="Select algorithm" />
        </SelectTrigger>
        <SelectContent className="bg-gray-700 text-white">
          <SelectItem value="minimax2">Minimax</SelectItem>
          <SelectItem value="random">Random</SelectItem>
          <SelectItem value="mcts-binary">MCTS Binary</SelectItem>
          <SelectItem value="mcts-binary-dk">MCTS Binary DK</SelectItem>
          <SelectItem value="mcts-fractional">MCTS Fractional</SelectItem>
          <SelectItem value="mcts-fractional-dk">MCTS Fractional DK</SelectItem>
          <SelectItem value="mcts-binary-minimax2">MCTS Minimax</SelectItem>
        </SelectContent>
      </Select>
    </div>
    <div>
      <label className="block mb-1">
        {algorithm[algoKey] === "minimax" ? "Depths:" : "Simulations:"}
      </label>
      <Input
        type="number"
        value={iterations[algoKey]}
        onChange={(e) =>
          setIterations((prev) => ({
            ...prev,
            [algoKey]: Math.max(1, parseInt(e.target.value) || 100),
          }))
        }
        min={1}
        className="w-full bg-gray-700 text-white"
      />
    </div>
  </div>
);

export default BotSettings;
