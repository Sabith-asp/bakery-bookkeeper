import Lottie from "lottie-react";
import { useLottie } from "@/hooks/useLottie";
import { ANIMATIONS } from "@/lib/animations";

interface EmptyStateProps {
  message: string;
}

const EmptyState = ({ message }: EmptyStateProps) => {
  const animData = useLottie(ANIMATIONS.empty);

  return (
    <div className="flex flex-col items-center justify-center py-10 gap-2">
      {animData && (
        <Lottie animationData={animData} loop style={{ width: 180, height: 74 }} />
      )}
      <p className="text-sm text-muted-foreground text-center">{message}</p>
    </div>
  );
};

export default EmptyState;
