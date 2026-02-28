import { Loader2 } from "lucide-react";
import { useApiLoading } from "@/state/apiLoading";

const GlobalApiLoader = () => {
  const isApiLoading = useApiLoading();

  if (!isApiLoading) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-4">
      <div className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm text-foreground shadow-md">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Syncing data...</span>
      </div>
    </div>
  );
};

export default GlobalApiLoader;
