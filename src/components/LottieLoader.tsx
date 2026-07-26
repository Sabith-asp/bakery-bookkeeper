import Lottie from "lottie-react";
import { useLottie } from "@/hooks/useLottie";
import { ANIMATIONS } from "@/lib/animations";

interface LottieLoaderProps {
  fullScreen?: boolean;
}

const LottieLoader = ({ fullScreen = false }: LottieLoaderProps) => {
  const animData = useLottie(ANIMATIONS.loading);

  return (
    <div className={fullScreen ? "flex min-h-screen items-center justify-center" : "flex h-screen items-center justify-center"}>
      {animData ? (
        <Lottie animationData={animData} loop style={{ width: 160, height: 160 }} />
      ) : (
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      )}
    </div>
  );
};

export default LottieLoader;
