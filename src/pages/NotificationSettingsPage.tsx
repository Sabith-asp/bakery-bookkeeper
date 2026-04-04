import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationApi } from "@/api/notification";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from "@/components/PageHeader";
import BottomNav from "@/components/BottomNav";
import { useToast } from "@/hooks/use-toast";
import { useApiLoading } from "@/state/apiLoading";
import { ArrowLeft, Bell, BellOff, BellRing, Send } from "lucide-react";
import {
  isPushSupported,
  subscribeToPush,
  unsubscribeFromPush,
  getCurrentSubscription,
} from "@/utils/pushSubscription";
import { cn } from "@/lib/utils";

const HOURS = Array.from({ length: 24 }, (_, i) => {
  const h = i % 12 || 12;
  const ampm = i < 12 ? "AM" : "PM";
  return { value: i, label: `${h}:00 ${ampm}` };
});

const NotificationSettingsPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isApiLoading = useApiLoading();

  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subLoading, setSubLoading] = useState(true);

  // Check current subscription status on mount
  useEffect(() => {
    if (!isPushSupported()) { setSubLoading(false); return; }
    getCurrentSubscription().then((sub) => {
      setIsSubscribed(!!sub);
      setSubLoading(false);
    });
  }, []);

  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ["notification-settings"],
    queryFn: notificationApi.getSettings,
  });

  const settingsMutation = useMutation({
    mutationFn: notificationApi.updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-settings"] });
      toast({ title: "Settings saved" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save settings", variant: "destructive" });
    },
  });

  const testMutation = useMutation({
    mutationFn: notificationApi.sendTest,
    onSuccess: () => toast({ title: "Test sent", description: "Check your notifications" }),
    onError: () => toast({ title: "Error", description: "Failed to send test", variant: "destructive" }),
  });

  const handleSubscribeToggle = async () => {
    if (!isPushSupported()) {
      toast({ title: "Not supported", description: "Push notifications are not supported in this browser", variant: "destructive" });
      return;
    }

    setSubLoading(true);
    try {
      if (isSubscribed) {
        const endpoint = await unsubscribeFromPush();
        if (endpoint) await notificationApi.unsubscribe(endpoint);
        setIsSubscribed(false);
        toast({ title: "Unsubscribed", description: "Push notifications disabled on this device" });
      } else {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          toast({ title: "Permission denied", description: "Enable notifications in your browser settings", variant: "destructive" });
          return;
        }
        const vapidKey = await notificationApi.getVapidPublicKey();
        const sub = await subscribeToPush(vapidKey);
        if (!sub) throw new Error("Subscription failed");
        await notificationApi.subscribe(sub);
        setIsSubscribed(true);
        toast({ title: "Subscribed", description: "Push notifications enabled on this device" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to update subscription", variant: "destructive" });
    } finally {
      setSubLoading(false);
    }
  };

  const handleToggle = (key: "dailyReminderEnabled" | "weeklySummaryEnabled" | "budgetAlertsEnabled") => {
    if (!settings) return;
    settingsMutation.mutate({ ...settings, [key]: !settings[key] });
  };

  const handleHourChange = (hour: number) => {
    if (!settings) return;
    settingsMutation.mutate({ ...settings, reminderHour: hour });
  };

  const isBusy = settingsMutation.isPending || isApiLoading;

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="flex items-center gap-3 px-4 pt-5 pb-3 border-b border-border/60 bg-card/60 backdrop-blur-sm sticky top-0 z-40">
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full shrink-0" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15">
            <BellRing className="h-3.5 w-3.5 text-primary" />
          </div>
          <h1 className="text-lg font-bold leading-tight">Notifications</h1>
        </div>
      </div>

      <div className="px-4 pt-5 space-y-5">

        {/* Subscribe card */}
        <Card className={cn("shadow-sm border", isSubscribed ? "border-primary/30 bg-primary/5" : "border-border")}>
          <CardContent className="py-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full", isSubscribed ? "bg-primary/15" : "bg-muted")}>
                  {isSubscribed
                    ? <Bell className="h-5 w-5 text-primary" />
                    : <BellOff className="h-5 w-5 text-muted-foreground" />}
                </div>
                <div>
                  <p className="text-sm font-semibold">{isSubscribed ? "Notifications active" : "Notifications off"}</p>
                  <p className="text-xs text-muted-foreground">
                    {isSubscribed ? "This device will receive push notifications" : "Enable to receive reminders on this device"}
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant={isSubscribed ? "outline" : "default"}
                onClick={handleSubscribeToggle}
                disabled={subLoading}
                className="shrink-0"
              >
                {subLoading ? "..." : isSubscribed ? "Disable" : "Enable"}
              </Button>
            </div>

            {!isPushSupported() && (
              <p className="mt-3 text-xs text-muted-foreground border-t border-border/60 pt-3">
                Push notifications require a supported browser and the app installed to your home screen on iOS.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Settings */}
        {settingsLoading ? (
          <p className="text-sm text-muted-foreground text-center py-4">Loading settings...</p>
        ) : settings ? (
          <>
            <Card className="shadow-sm">
              <CardContent className="py-0 divide-y divide-border/60">

                {/* Daily reminder */}
                <div className="py-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Daily reminder</p>
                      <p className="text-xs text-muted-foreground">Remind to log today's transactions</p>
                    </div>
                    <button
                      onClick={() => handleToggle("dailyReminderEnabled")}
                      disabled={isBusy}
                      className={cn(
                        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50",
                        settings.dailyReminderEnabled ? "bg-primary" : "bg-input"
                      )}
                      role="switch"
                      aria-checked={settings.dailyReminderEnabled}
                    >
                      <span className={cn(
                        "pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
                        settings.dailyReminderEnabled ? "translate-x-6" : "translate-x-1"
                      )} />
                    </button>
                  </div>

                  {settings.dailyReminderEnabled && (
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">Remind me at</p>
                      <Select
                        value={String(settings.reminderHour)}
                        onValueChange={(v) => handleHourChange(Number(v))}
                        disabled={isBusy}
                      >
                        <SelectTrigger className="h-8 w-32 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {HOURS.map((h) => (
                            <SelectItem key={h.value} value={String(h.value)}>
                              {h.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                {/* Weekly summary */}
                <div className="flex items-center justify-between py-4">
                  <div>
                    <p className="text-sm font-medium">Weekly summary</p>
                    <p className="text-xs text-muted-foreground">Monday morning financial recap</p>
                  </div>
                  <button
                    onClick={() => handleToggle("weeklySummaryEnabled")}
                    disabled={isBusy}
                    className={cn(
                      "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50",
                      settings.weeklySummaryEnabled ? "bg-primary" : "bg-input"
                    )}
                    role="switch"
                    aria-checked={settings.weeklySummaryEnabled}
                  >
                    <span className={cn(
                      "pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
                      settings.weeklySummaryEnabled ? "translate-x-6" : "translate-x-1"
                    )} />
                  </button>
                </div>

                {/* Budget alerts */}
                <div className="flex items-center justify-between py-4">
                  <div>
                    <p className="text-sm font-medium">Budget alerts</p>
                    <p className="text-xs text-muted-foreground">Notify when category budget is exceeded</p>
                  </div>
                  <button
                    onClick={() => handleToggle("budgetAlertsEnabled")}
                    disabled={isBusy}
                    className={cn(
                      "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50",
                      settings.budgetAlertsEnabled ? "bg-primary" : "bg-input"
                    )}
                    role="switch"
                    aria-checked={settings.budgetAlertsEnabled}
                  >
                    <span className={cn(
                      "pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
                      settings.budgetAlertsEnabled ? "translate-x-6" : "translate-x-1"
                    )} />
                  </button>
                </div>

              </CardContent>
            </Card>

            {/* Test notification */}
            {isSubscribed && (
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => testMutation.mutate()}
                disabled={testMutation.isPending || isBusy}
              >
                <Send className="h-4 w-4" />
                {testMutation.isPending ? "Sending..." : "Send test notification"}
              </Button>
            )}
          </>
        ) : null}

      </div>

      <BottomNav />
    </div>
  );
};

export default NotificationSettingsPage;
