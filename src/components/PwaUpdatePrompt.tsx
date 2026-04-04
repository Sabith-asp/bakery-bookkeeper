import { useEffect } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";

const PwaUpdatePrompt = () => {
  const { toast } = useToast();
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      // Check for updates every hour
      if (r) setInterval(() => r.update(), 60 * 60 * 1000);
    },
  });

  useEffect(() => {
    if (!needRefresh) return;
    toast({
      title: "Update available",
      description: "A new version of Fynlo is ready.",
      duration: 0,
      action: (
        <ToastAction altText="Update now" onClick={() => updateServiceWorker(true)}>
          Update
        </ToastAction>
      ),
    });
  }, [needRefresh]);

  return null;
};

export default PwaUpdatePrompt;
