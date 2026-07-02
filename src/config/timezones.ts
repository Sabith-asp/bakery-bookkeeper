export interface TimezoneOption {
  label: string;
  value: string;
}

export const TIMEZONES: TimezoneOption[] = [
  { label: "IST — India (UTC+5:30)",              value: "Asia/Kolkata" },
  { label: "GST — Gulf / UAE (UTC+4)",             value: "Asia/Dubai" },
  { label: "PKT — Pakistan (UTC+5)",               value: "Asia/Karachi" },
  { label: "BST — Bangladesh (UTC+6)",             value: "Asia/Dhaka" },
  { label: "LKT — Sri Lanka (UTC+5:30)",           value: "Asia/Colombo" },
  { label: "SGT — Singapore / Malaysia (UTC+8)",   value: "Asia/Singapore" },
  { label: "CST — China (UTC+8)",                  value: "Asia/Shanghai" },
  { label: "JST — Japan (UTC+9)",                  value: "Asia/Tokyo" },
  { label: "KST — South Korea (UTC+9)",            value: "Asia/Seoul" },
  { label: "UTC — Universal",                       value: "UTC" },
  { label: "GMT — UK (UTC+0/+1)",                  value: "Europe/London" },
  { label: "CET — Central Europe (UTC+1/+2)",      value: "Europe/Paris" },
  { label: "EET — Eastern Europe (UTC+2/+3)",      value: "Europe/Athens" },
  { label: "MSK — Moscow (UTC+3)",                 value: "Europe/Moscow" },
  { label: "EST — US East (UTC-5/-4)",             value: "America/New_York" },
  { label: "CST — US Central (UTC-6/-5)",          value: "America/Chicago" },
  { label: "MST — US Mountain (UTC-7/-6)",         value: "America/Denver" },
  { label: "PST — US West (UTC-8/-7)",             value: "America/Los_Angeles" },
  { label: "BRT — Brazil (UTC-3)",                 value: "America/Sao_Paulo" },
  { label: "AEST — Australia East (UTC+10/+11)",   value: "Australia/Sydney" },
  { label: "NZST — New Zealand (UTC+12/+13)",      value: "Pacific/Auckland" },
];
