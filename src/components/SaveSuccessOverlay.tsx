import { useEffect, useState } from "react";
import Lottie from "lottie-react";

const SUCCESS_ANIMATION = "https://assets3.lottiefiles.com/packages/lf20_jbrw3hcz.json";

// Pre-fetch animation on module load so it's ready instantly
let cachedAnimData: object | null = null;
fetch(SUCCESS_ANIMATION)
  .then((r) => r.json())
  .then((d) => { cachedAnimData = d; })
  .catch(() => {});

interface SaveSuccessOverlayProps {
  show: boolean;
}

const SaveSuccessOverlay = ({ show }: SaveSuccessOverlayProps) => {
  const [animData, setAnimData] = useState<object | null>(cachedAnimData);

  useEffect(() => {
    if (!cachedAnimData) {
      fetch(SUCCESS_ANIMATION)
        .then((r) => r.json())
        .then((d) => { cachedAnimData = d; setAnimData(d); })
        .catch(() => {});
    } else {
      setAnimData(cachedAnimData);
    }
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-background/80 backdrop-blur-sm">
      {animData && (
        <Lottie
          animationData={animData}
          loop={false}
          style={{ width: 240, height: 135 }}
        />
      )}
    </div>
  );
};

export default SaveSuccessOverlay;
