import { useEffect, useState } from "react";
import Lottie from "lottie-react";

const EMPTY_ANIMATION = "https://assets2.lottiefiles.com/packages/lf20_ydo1amjm.json";

interface EmptyStateProps {
  message: string;
}

const EmptyState = ({ message }: EmptyStateProps) => {
  const [animData, setAnimData] = useState<object | null>(null);

  useEffect(() => {
    fetch(EMPTY_ANIMATION)
      .then((r) => r.json())
      .then(setAnimData)
      .catch(() => {});
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-10 gap-2">
      {animData && (
        <Lottie
          animationData={animData}
          loop
          style={{ width: 180, height: 74 }}
        />
      )}
      <p className="text-sm text-muted-foreground text-center">{message}</p>
    </div>
  );
};

export default EmptyState;
