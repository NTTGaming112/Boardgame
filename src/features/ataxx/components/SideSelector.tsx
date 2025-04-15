import { RadioGroup, RadioGroupItem } from "@/ui/radio-group";
import { Label } from "@/ui/label";
import { Avatar, AvatarFallback } from "@/ui/avatar";
import { Side } from "../types";

interface SideSelectorProps {
  selectedSide: Side;
  onSideChange: (side: Side) => void;
}

const SideSelector: React.FC<SideSelectorProps> = ({
  selectedSide,
  onSideChange,
}) => {
  return (
    <div>
      <h2 className="text-center font-semibold mb-2">Select Side</h2>
      <RadioGroup
        value={selectedSide}
        onValueChange={(value: Side) => onSideChange(value)}
        className="flex justify-center space-x-4"
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="yellow" id="yellow" />
          <Label htmlFor="yellow" className="flex items-center space-x-2">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-yellow-400 text-black">
                Y
              </AvatarFallback>
            </Avatar>
            <span>Yellow</span>
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="red" id="red" />
          <Label htmlFor="red" className="flex items-center space-x-2">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-red-500 text-white">
                R
              </AvatarFallback>
            </Avatar>
            <span>Red</span>
          </Label>
        </div>
      </RadioGroup>
    </div>
  );
};

export default SideSelector;
