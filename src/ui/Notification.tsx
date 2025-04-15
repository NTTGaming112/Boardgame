import { Alert, AlertDescription, AlertTitle } from "@/ui/alert";
import { Button } from "@/ui/button";

interface NotificationProps {
  title: string;
  description: string;
  variant?: "default" | "destructive";
  onClose: () => void;
}

const Notification: React.FC<NotificationProps> = ({
  title,
  description,
  variant = "default",
  onClose,
}) => {
  return (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-full max-w-sm">
      <Alert variant={variant}>
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription>{description}</AlertDescription>
        <div className="mt-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </Alert>
    </div>
  );
};

export default Notification;
