// src/features/ataxx/components/BoardSelector.tsx
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
  const layoutIds = Object.keys(layouts).map(Number); // Lấy danh sách ID từ layouts

  return (
    <div>
      <h2 className="text-center font-semibold mb-2">Select Board</h2>
      <div className="grid grid-cols-4 gap-2">
        {layoutIds.map((id) => (
          <Button
            key={id}
            variant={selectedBoard === id ? "default" : "outline"}
            className={`w-12 h-12 p-0 ${
              selectedBoard === id ? "bg-blue-500" : "bg-green-600"
            } border-2 border-white`}
            onClick={() => onBoardSelect(id)}
          >
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-xs">B{id}</span>
            </div>
          </Button>
        ))}
      </div>
    </div>
  );
};

export default BoardSelector;
