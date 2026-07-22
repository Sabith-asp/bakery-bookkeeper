import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { prayerApi } from "@/api/prayer";
import type { PrayerReminderConfig } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { ArrowLeft, MapPin, X, Bell, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";

const PRAYER_ORDER = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];

const ARABIC: Record<string, string> = {
  Fajr: "فجر", Dhuhr: "ظهر", Asr: "عصر", Maghrib: "مغرب", Isha: "عشاء",
};

const REMINDER_LABELS: Record<string, string> = {
  BeforePrayer_15: "15 min before",
  BeforePrayer_30: "30 min before",
  BeforePrayer_10: "10 min before",
  BeforePrayer_5:  "5 min before",
  AtPrayer:        "At prayer time",
  AfterPrayer_15:  "15 min after (if pending)",
  AfterPrayer_30:  "30 min after (if pending)",
  AfterPrayer_60:  "60 min after (if pending)",
  EndOfDay:        "End-of-day summary",
};

const CALCULATION_METHODS = [
  { value: "MWL",      label: "Muslim World League (18°/17°)" },
  { value: "Karachi",  label: "University of Islamic Sciences, Karachi (18°/18°)" },
  { value: "ISNA",     label: "ISNA — North America (15°/15°)" },
  { value: "Egyptian", label: "Egyptian (19.5°/17.5°)" },
  { value: "UmmAlQura",label: "Umm al-Qura — Saudi Arabia" },
  { value: "Custom",   label: "Custom angles" },
];

const ASR_METHODS = [
  { value: "Standard", label: "Standard (Shafi'i / Maliki / Hanbali)" },
  { value: "Hanafi",   label: "Hanafi" },
];

// ── Toggle ──────────────────────────────────────────────────────────────────

const Toggle = ({ enabled, onChange }: { enabled: boolean; onChange: () => void }) => (
  <button
    onClick={onChange}
    className={cn(
      "relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors",
      enabled ? "bg-primary" : "bg-input"
    )}
  >
    <span className={cn(
      "inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform mt-1",
      enabled ? "translate-x-6" : "translate-x-1"
    )} />
  </button>
);

// ── Main page ───────────────────────────────────────────────────────────────

type Tab = "reminders" | "location" | "org";

const PrayerSettingsPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const qc = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === "Admin";
  const [tab, setTab] = useState<Tab>("reminders");

  // ── Location state
  const [cityName,   setCityName]   = useState("");
  const [latitude,   setLatitude]   = useState("");
  const [longitude,  setLongitude]  = useState("");
  const [timezone,   setTimezone]   = useState("");
  const [locSaving,  setLocSaving]  = useState(false);

  // ── Org settings state
  const [orgLat,     setOrgLat]     = useState("");
  const [orgLng,     setOrgLng]     = useState("");
  const [orgTz,      setOrgTz]      = useState("");
  const [orgMethod,  setOrgMethod]  = useState("MWL");
  const [orgAsr,     setOrgAsr]     = useState("Standard");
  const [orgFajrA,   setOrgFajrA]   = useState("18");
  const [orgIshaA,   setOrgIshaA]   = useState("17");
  const [orgSaving,  setOrgSaving]  = useState(false);

  // ── Queries
  const { data: reminders, isLoading: remLoading } = useQuery({
    queryKey: ["prayer-reminders"],
    queryFn: prayerApi.getReminders,
  });

  const { data: userLoc } = useQuery({
    queryKey: ["prayer-user-location"],
    queryFn: prayerApi.getUserLocation,
  });

  const { data: orgSettings } = useQuery({
    queryKey: ["prayer-org-settings"],
    queryFn: prayerApi.getOrgSettings,
    enabled: isAdmin,
  });

  // Sync form from fetched data
  useEffect(() => {
    if (userLoc) {
      setCityName(userLoc.cityName ?? "");
      setLatitude(userLoc.latitude?.toString() ?? "");
      setLongitude(userLoc.longitude?.toString() ?? "");
      setTimezone(userLoc.timezone ?? "");
    }
  }, [userLoc]);

  useEffect(() => {
    if (orgSettings) {
      setOrgLat(orgSettings.latitude.toString());
      setOrgLng(orgSettings.longitude.toString());
      setOrgTz(orgSettings.timezone);
      setOrgMethod(orgSettings.calculationMethod);
      setOrgAsr(orgSettings.asrMethod);
      setOrgFajrA(orgSettings.fajrAngle.toString());
      setOrgIshaA(orgSettings.ishaAngle.toString());
    }
  }, [orgSettings]);

  // ── Reminder mutation
  const reminderMutation = useMutation({
    mutationFn: prayerApi.updateReminder,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["prayer-reminders"] }),
    onError: () => toast({ title: "Error", description: "Failed to save reminder", variant: "destructive" }),
  });

  const toggleReminder = (cfg: PrayerReminderConfig) => {
    reminderMutation.mutate({
      prayerName:    cfg.prayerName,
      reminderType:  cfg.reminderType,
      minutesOffset: cfg.minutesOffset,
      isEnabled:     !cfg.isEnabled,
    });
  };

  // ── Location save
  const saveLocation = async () => {
    if (!latitude || !longitude || !timezone) {
      toast({ title: "Fill in all location fields", variant: "destructive" });
      return;
    }
    setLocSaving(true);
    try {
      await prayerApi.updateUserLocation({
        cityName:  cityName || undefined,
        latitude:  parseFloat(latitude),
        longitude: parseFloat(longitude),
        timezone,
      });
      qc.invalidateQueries({ queryKey: ["prayer-user-location"] });
      qc.invalidateQueries({ queryKey: ["prayer-dashboard"] });
      toast({ title: "Location saved" });
    } catch {
      toast({ title: "Error", description: "Failed to save location", variant: "destructive" });
    } finally {
      setLocSaving(false);
    }
  };

  const clearLocation = async () => {
    await prayerApi.clearUserLocation();
    qc.invalidateQueries({ queryKey: ["prayer-user-location"] });
    qc.invalidateQueries({ queryKey: ["prayer-dashboard"] });
    setCityName(""); setLatitude(""); setLongitude(""); setTimezone("");
    toast({ title: "Location cleared — using org default" });
  };

  // ── Org settings save
  const saveOrgSettings = async () => {
    setOrgSaving(true);
    try {
      await prayerApi.updateOrgSettings({
        latitude:          parseFloat(orgLat),
        longitude:         parseFloat(orgLng),
        timezone:          orgTz,
        calculationMethod: orgMethod,
        asrMethod:         orgAsr,
        fajrAngle:         parseFloat(orgFajrA),
        ishaAngle:         parseFloat(orgIshaA),
      });
      qc.invalidateQueries({ queryKey: ["prayer-org-settings"] });
      qc.invalidateQueries({ queryKey: ["prayer-dashboard"] });
      toast({ title: "Organization settings saved" });
    } catch (e: any) {
      toast({ title: "Error", description: e?.response?.data?.message ?? "Failed to save", variant: "destructive" });
    } finally {
      setOrgSaving(false);
    }
  };

  // Group reminders by prayer
  const byPrayer = PRAYER_ORDER.reduce<Record<string, PrayerReminderConfig[]>>((acc, p) => {
    acc[p] = (reminders ?? []).filter(r => r.prayerName === p);
    return acc;
  }, {});
  const globalReminders = (reminders ?? []).filter(r => r.prayerName === "All");

  const tabs: { key: Tab; label: string; icon: typeof Bell }[] = [
    { key: "reminders", label: "Reminders", icon: Bell },
    { key: "location",  label: "My Location", icon: MapPin },
    ...(isAdmin ? [{ key: "org" as Tab, label: "Org Settings", icon: Settings2 }] : []),
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 md:px-6 pt-5 pb-3 border-b sticky top-0 bg-background/95 backdrop-blur-sm z-10">
        <Button variant="ghost" size="icon" onClick={() => navigate("/prayer")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-lg font-bold">Prayer Settings</h1>
      </div>

      <div className="px-4 pt-4 space-y-4 md:px-6 lg:max-w-2xl lg:mx-auto">
        {/* Tab bar */}
        <div className="flex gap-1 rounded-xl border bg-muted/40 p-1">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all",
                tab === key
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* ── Reminders tab ─────────────────────────────────────────────── */}
        {tab === "reminders" && (
          remLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}
            </div>
          ) : (
            <div className="space-y-4">
              {PRAYER_ORDER.map(prayer => (
                <div key={prayer}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-base font-arabic">{ARABIC[prayer]}</span>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{prayer}</p>
                  </div>
                  <Card className="shadow-sm">
                    <CardContent className="py-0 divide-y divide-border/60">
                      {byPrayer[prayer].map(cfg => (
                        <div key={cfg.id} className="flex items-center justify-between py-3">
                          <p className="text-sm">{REMINDER_LABELS[cfg.reminderType] ?? cfg.reminderType}</p>
                          <Toggle enabled={cfg.isEnabled} onChange={() => toggleReminder(cfg)} />
                        </div>
                      ))}
                      {byPrayer[prayer].length === 0 && (
                        <p className="text-xs text-muted-foreground py-3">No reminder configs</p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              ))}

              {/* Global reminders */}
              {globalReminders.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Global</p>
                  <Card className="shadow-sm">
                    <CardContent className="py-0 divide-y divide-border/60">
                      {globalReminders.map(cfg => (
                        <div key={cfg.id} className="flex items-center justify-between py-3">
                          <p className="text-sm">{REMINDER_LABELS[cfg.reminderType] ?? cfg.reminderType}</p>
                          <Toggle enabled={cfg.isEnabled} onChange={() => toggleReminder(cfg)} />
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )
        )}

        {/* ── Location tab ──────────────────────────────────────────────── */}
        {tab === "location" && (
          <div className="space-y-4">
            <Card className="shadow-sm">
              <CardContent className="py-4 space-y-4">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    Personal Location Override
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Set your own city to get accurate prayer times. Leave empty to use the
                    organization's configured location.
                  </p>
                </div>

                {userLoc?.latitude && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20">
                    <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                    <p className="text-xs text-primary font-medium flex-1">
                      Using: {userLoc.cityName || `${userLoc.latitude?.toFixed(4)}, ${userLoc.longitude?.toFixed(4)}`}
                    </p>
                    <button onClick={clearLocation}>
                      <X className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                    </button>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-xs font-medium">City Name (optional)</label>
                  <input
                    value={cityName}
                    onChange={e => setCityName(e.target.value)}
                    placeholder="e.g. Malappuram, Kerala"
                    className="w-full h-10 px-3 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-medium">Latitude</label>
                    <input
                      value={latitude}
                      onChange={e => setLatitude(e.target.value)}
                      placeholder="e.g. 11.0556"
                      type="number" step="any"
                      className="w-full h-10 px-3 mt-1 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium">Longitude</label>
                    <input
                      value={longitude}
                      onChange={e => setLongitude(e.target.value)}
                      placeholder="e.g. 76.0822"
                      type="number" step="any"
                      className="w-full h-10 px-3 mt-1 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium">Timezone (IANA)</label>
                  <input
                    value={timezone}
                    onChange={e => setTimezone(e.target.value)}
                    placeholder="e.g. Asia/Kolkata"
                    className="w-full h-10 px-3 mt-1 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Kerala: Asia/Kolkata · UAE: Asia/Dubai · Saudi: Asia/Riyadh
                  </p>
                </div>

                <Button
                  className="w-full"
                  onClick={saveLocation}
                  disabled={locSaving}
                >
                  {locSaving ? "Saving..." : "Save My Location"}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── Org Settings tab (admin only) ─────────────────────────────── */}
        {tab === "org" && isAdmin && (
          <div className="space-y-4">
            <Card className="shadow-sm">
              <CardContent className="py-4 space-y-4">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    Organization Prayer Settings
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Default location and method for all users in your organization.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-medium">Latitude</label>
                    <input
                      value={orgLat}
                      onChange={e => setOrgLat(e.target.value)}
                      type="number" step="any"
                      className="w-full h-10 px-3 mt-1 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium">Longitude</label>
                    <input
                      value={orgLng}
                      onChange={e => setOrgLng(e.target.value)}
                      type="number" step="any"
                      className="w-full h-10 px-3 mt-1 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium">Timezone (IANA)</label>
                  <input
                    value={orgTz}
                    onChange={e => setOrgTz(e.target.value)}
                    placeholder="e.g. Asia/Kolkata"
                    className="w-full h-10 px-3 mt-1 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium">Calculation Method</label>
                  <select
                    value={orgMethod}
                    onChange={e => setOrgMethod(e.target.value)}
                    className="w-full h-10 px-3 mt-1 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    {CALCULATION_METHODS.map(m => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium">Asr Method</label>
                  <select
                    value={orgAsr}
                    onChange={e => setOrgAsr(e.target.value)}
                    className="w-full h-10 px-3 mt-1 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    {ASR_METHODS.map(m => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>

                {orgMethod === "Custom" && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-medium">Fajr Angle (°)</label>
                      <input
                        value={orgFajrA}
                        onChange={e => setOrgFajrA(e.target.value)}
                        type="number" step="0.5"
                        className="w-full h-10 px-3 mt-1 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium">Isha Angle (°)</label>
                      <input
                        value={orgIshaA}
                        onChange={e => setOrgIshaA(e.target.value)}
                        type="number" step="0.5"
                        className="w-full h-10 px-3 mt-1 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                    </div>
                  </div>
                )}

                <Button
                  className="w-full"
                  onClick={saveOrgSettings}
                  disabled={orgSaving}
                >
                  {orgSaving ? "Saving..." : "Save Organization Settings"}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default PrayerSettingsPage;
