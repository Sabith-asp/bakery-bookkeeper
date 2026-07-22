import { useEffect, useState } from "react";
import Lottie from "lottie-react";
import FynloIcon from "@/components/FynloIcon";
import { useLottie } from "@/hooks/useLottie";
import { ANIMATIONS } from "@/lib/animations";

const SplashScreen = ({ onDone }: { onDone: () => void }) => {
  const [fadeOut, setFadeOut] = useState(false);
  const animData = useLottie(ANIMATIONS.splash);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFadeOut(true);
      setTimeout(onDone, 400);
    }, 1800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={`fixed inset-0 z-[200] flex flex-col items-center justify-center bg-background transition-opacity duration-400 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="flex flex-col items-center gap-6">
        <div className="w-[200px] h-[200px] flex items-center justify-center">
          {animData ? (
            <Lottie animationData={animData} loop style={{ width: 200, height: 200 }} />
          ) : (
            <div className="animate-[pulse_2s_ease-in-out_infinite]">
              <FynloIcon size={110} />
            </div>
          )}
        </div>
        <div className="text-center space-y-1">
          <h1 className="text-3xl font-bold tracking-tight font-display">Fynlo</h1>
          <p className="text-sm text-muted-foreground">Your business, managed.</p>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
