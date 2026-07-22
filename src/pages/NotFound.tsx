import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import Lottie from "lottie-react";
import { useLottie } from "@/hooks/useLottie";
import { ANIMATIONS } from "@/lib/animations";

const NotFound = () => {
  const location = useLocation();
  const animData = useLottie(ANIMATIONS.notFound);

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4">
      {animData && (
        <Lottie animationData={animData} loop style={{ width: 280, height: 280 }} />
      )}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold font-display">Page not found</h1>
        <p className="text-muted-foreground">The page <span className="font-mono text-sm">{location.pathname}</span> doesn't exist.</p>
      </div>
      <a
        href="/"
        className="mt-2 inline-flex h-10 items-center rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        Go to Dashboard
      </a>
    </div>
  );
};

export default NotFound;
