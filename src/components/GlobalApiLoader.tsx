import { useApiLoading } from "@/state/apiLoading";

const GlobalApiLoader = () => {
  const isApiLoading = useApiLoading();

  return (
    <div
      className={`pointer-events-none fixed inset-x-0 top-0 z-[100] h-[3px] overflow-hidden transition-opacity duration-300 ${
        isApiLoading ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="h-full w-1/4 rounded-full bg-primary animate-loader-travel" />
    </div>
  );
};

export default GlobalApiLoader;
