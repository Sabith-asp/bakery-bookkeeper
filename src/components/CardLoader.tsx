import Lottie from "lottie-react";
import { useLottie } from "@/hooks/useLottie";
import { ANIMATIONS } from "@/lib/animations";

const CardLoader = () => {
  const animData = useLottie(ANIMATIONS.loading);
  return (
    <div className="flex items-center justify-center py-10">
      {animData ? (
        <Lottie animationData={animData} loop style={{ width: 90, height: 90 }} />
      ) : (
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent my-4" />
      )}
    </div>
  );
};

export default CardLoader;
