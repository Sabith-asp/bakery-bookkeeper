import { useAuth } from "@/context/AuthContext";

/** Returns the org's IANA timezone string. Falls back to "UTC" for SuperAdmin. */
export function useOrgTimezone(): string {
  const { user, isSuperAdmin } = useAuth();
  if (isSuperAdmin) return "UTC";
  return user?.organizationTimezone || "UTC";
}

// Matches a bare "YYYY-MM-DD" string, or the backend's actual wire format for
// a DATE-only column: "YYYY-MM-DDT00:00:00" (System.Text.Json always emits a
// time component for a plain DateTime, even when the underlying column is a
// timezone-less Postgres DATE with no time-of-day). Either way the date
// portion is captured in group 1.
const DATE_ONLY_RE = /^(\d{4}-\d{2}-\d{2})(?:T00:00:00(?:\.0+)?)?$/;

/**
 * Format a date string or Date object using the given IANA timezone.
 * options mirrors Intl.DateTimeFormatOptions.
 *
 * A date-only value (see DATE_ONLY_RE above) has no real time component — if
 * the bare "YYYY-MM-DD" form is parsed by JS it becomes UTC midnight, and the
 * "YYYY-MM-DDT00:00:00" form is parsed as local midnight in the BROWSER's own
 * timezone — either way, running it through a timeZone behind that implied
 * zone (e.g. America/* while the browser/server is ahead of UTC) silently
 * displays the previous day. Such strings are formatted as a local calendar
 * date instead, with no timezone conversion at all.
 */
export function formatInTz(
  date: string | Date,
  options: Intl.DateTimeFormatOptions,
  timezone: string
): string {
  const dateOnlyMatch = typeof date === "string" ? date.match(DATE_ONLY_RE) : null;
  if (dateOnlyMatch) {
    const [y, m, d] = dateOnlyMatch[1].split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("en-IN", options);
  }
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-IN", { timeZone: timezone, ...options });
}

/** Time only in the given IANA timezone, e.g. "2:45 PM". Only for true timestamps. */
export function timeInTz(date: string | Date, timezone: string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("en-US", {
    timeZone: timezone,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/** Date + time in the given IANA timezone, e.g. "29 Jun, 2:45 PM". Only for true timestamps. */
export function dateTimeInTz(date: string | Date, timezone: string): string {
  return `${formatInTz(date, { day: "numeric", month: "short" }, timezone)}, ${timeInTz(date, timezone)}`;
}

/** Returns "YYYY-MM-DD" for today in the given timezone. */
export function todayInTz(timezone: string): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: timezone });
}

/** Returns "YYYY-MM-DD" for today in the org's timezone. */
export function useOrgToday(): string {
  const timezone = useOrgTimezone();
  return todayInTz(timezone);
}

/** Standard short date: "29 Jun 2025" */
export function shortDate(date: string | Date, timezone: string): string {
  return formatInTz(date, { day: "2-digit", month: "short", year: "numeric" }, timezone);
}

/** Numeric date: "29/06/2025" */
export function numericDate(date: string | Date, timezone: string): string {
  return formatInTz(date, { day: "2-digit", month: "2-digit", year: "numeric" }, timezone);
}
