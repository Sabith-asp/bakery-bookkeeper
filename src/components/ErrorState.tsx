import Lottie from "lottie-react";
import { useLottie } from "@/hooks/useLottie";
import { ANIMATIONS } from "@/lib/animations";
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

const ErrorState = ({ message = "Something went wrong", onRetry }: ErrorStateProps) => {
  const animData = useLottie(ANIMATIONS.error);

  return (
    <div className="flex flex-col items-center justify-center py-10 gap-3">
      {animData && (
        <Lottie animationData={animData} loop={false} style={{ width: 160, height: 160 }} />
      )}
      <p className="text-sm text-muted-foreground text-center">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
};

export default ErrorState;
