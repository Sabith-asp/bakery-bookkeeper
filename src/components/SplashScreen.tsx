import { useEffect, useState } from "react";
import Lottie from "lottie-react";

const SPLASH_ANIMATION = "https://assets9.lottiefiles.com/packages/lf20_s2lryxtd.json";
const MIN_DISPLAY_MS = 1800;

const SplashScreen = ({ onDone }: { onDone: () => void }) => {
  const [animData, setAnimData] = useState<object | null>(null);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const startTime = Date.now();

    fetch(SPLASH_ANIMATION)
      .then((r) => r.json())
      .then((data) => {
        setAnimData(data);
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, MIN_DISPLAY_MS - elapsed);
        setTimeout(() => {
          setFadeOut(true);
          setTimeout(onDone, 400);
        }, remaining);
      })
      .catch(() => {
        // Animation failed to load — dismiss immediately
        onDone();
      });
  }, []);

  return (
    <div
      className={`fixed inset-0 z-[200] flex flex-col items-center justify-center bg-background transition-opacity duration-400 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="flex flex-col items-center gap-6">
        {animData ? (
          <Lottie
            animationData={animData}
            loop
            style={{ width: 200, height: 200 }}
          />
        ) : (
          <div className="h-[200px] w-[200px]" />
        )}
        <div className="text-center space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Fynlo</h1>
          <p className="text-sm text-muted-foreground">Your business, managed.</p>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
