import { useAuth } from "@/context/AuthContext";

/** Returns the org's IANA timezone string. Falls back to "UTC" for SuperAdmin. */
export function useOrgTimezone(): string {
  const { user, isSuperAdmin } = useAuth();
  if (isSuperAdmin) return "UTC";
  return user?.organizationTimezone || "UTC";
}

/**
 * Format a date string or Date object using the given IANA timezone.
 * options mirrors Intl.DateTimeFormatOptions.
 */
export function formatInTz(
  date: string | Date,
  options: Intl.DateTimeFormatOptions,
  timezone: string
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-IN", { timeZone: timezone, ...options });
}

/** Returns "YYYY-MM-DD" for today in the given timezone. */
export function todayInTz(timezone: string): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: timezone });
}

/** Standard short date: "29 Jun 2025" */
export function shortDate(date: string | Date, timezone: string): string {
  return formatInTz(date, { day: "2-digit", month: "short", year: "numeric" }, timezone);
}

/** Numeric date: "29/06/2025" */
export function numericDate(date: string | Date, timezone: string): string {
  return formatInTz(date, { day: "2-digit", month: "2-digit", year: "numeric" }, timezone);
}
