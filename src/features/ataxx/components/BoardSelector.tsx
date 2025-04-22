import { Button } from "@/ui/button";
import { layouts } from "../maps";

interface BoardSelectorProps {
  selectedBoard: number | null;
  onBoardSelect: (id: number) => void;
}

const BoardSelector: React.FC<BoardSelectorProps> = ({
  selectedBoard,
  onBoardSelect,
}) => {
  const layoutIds = Object.keys(layouts).map(Number);

  return (
    <div>
      <h2 className="text-center font-semibold mb-2">Select Board</h2>
      <div className="flex flex-row justify-around">
        {layoutIds.map((id) => (
          <Button
            key={id}
            variant={selectedBoard === id ? "default" : "outline"}
            className={`w-20 h-20 p-0 ${
              selectedBoard === id
                ? "border-2 border-blue-500 opacity-100"
                : "border-0 opacity-50"
            } border-2 border-white bg-cover`}
            style={{
              backgroundImage: `url(/public/map${id}_bg.png)`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
            onClick={() => onBoardSelect(id)}
          ></Button>
        ))}
      </div>
    </div>
  );
};

export default BoardSelector;
