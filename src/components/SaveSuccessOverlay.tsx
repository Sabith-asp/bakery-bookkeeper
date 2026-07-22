import Lottie from "lottie-react";
import { useLottie } from "@/hooks/useLottie";
import { ANIMATIONS } from "@/lib/animations";

interface SaveSuccessOverlayProps {
  show: boolean;
}

const SaveSuccessOverlay = ({ show }: SaveSuccessOverlayProps) => {
  const animData = useLottie(ANIMATIONS.success);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-background/80 backdrop-blur-sm">
      {animData && (
        <Lottie animationData={animData} loop={false} style={{ width: 240, height: 135 }} />
      )}
    </div>
  );
};

export default SaveSuccessOverlay;
