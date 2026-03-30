import { useState } from "react";
import { format, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameDay } from "date-fns";
import { CalendarIcon } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface DateRangeFilterProps {
  startDate: string;
  endDate: string;
  onDateChange: (start: string, end: string) => void;
}

const presets = [
  { label: "Today", getRange: () => {
    const d = format(new Date(), "yyyy-MM-dd");
    return [d, d] as const;
  }},
  { label: "Yesterday", getRange: () => {
    const d = format(subDays(new Date(), 1), "yyyy-MM-dd");
    return [d, d] as const;
  }},
  { label: "This Week", getRange: () => [
    format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd"),
    format(endOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd"),
  ] as const },
  { label: "This Month", getRange: () => [
    format(startOfMonth(new Date()), "yyyy-MM-dd"),
    format(endOfMonth(new Date()), "yyyy-MM-dd"),
  ] as const },
  { label: "Last 7 Days", getRange: () => [
    format(subDays(new Date(), 6), "yyyy-MM-dd"),
    format(new Date(), "yyyy-MM-dd"),
  ] as const },
  { label: "Last 30 Days", getRange: () => [
    format(subDays(new Date(), 29), "yyyy-MM-dd"),
    format(new Date(), "yyyy-MM-dd"),
  ] as const },
];

const DateRangeFilter = ({ startDate, endDate, onDateChange }: DateRangeFilterProps) => {
  const [open, setOpen] = useState(false);

  const fromDate = startDate ? new Date(startDate + "T00:00:00") : undefined;
  const toDate = endDate ? new Date(endDate + "T00:00:00") : undefined;

  const activePreset = presets.find((p) => {
    const [s, e] = p.getRange();
    return s === startDate && e === endDate;
  });

  const rangeLabel = (() => {
    if (!fromDate) return "Select dates";
    if (!toDate || isSameDay(fromDate, toDate)) return format(fromDate, "MMM d, yyyy");
    return `${format(fromDate, "MMM d")} – ${format(toDate, "MMM d, yyyy")}`;
  })();

  const range: DateRange = { from: fromDate, to: toDate };

  return (
    <div className="space-y-2">
      {/* Preset chips */}
      <div className="flex flex-wrap gap-1.5">
        {presets.map((preset) => (
          <button
            key={preset.label}
            onClick={() => {
              const [s, e] = preset.getRange();
              onDateChange(s, e);
            }}
            className={cn(
              "px-2.5 py-1 text-xs rounded-full border font-medium transition-all",
              activePreset?.label === preset.label
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-background text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
            )}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Single range date picker */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left text-sm h-9 font-normal",
              activePreset ? "text-muted-foreground" : "text-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
            {rangeLabel}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start" sideOffset={4}>
          <Calendar
            mode="range"
            selected={range}
            onSelect={(selected) => {
              if (!selected?.from) return;
              const s = format(selected.from, "yyyy-MM-dd");
              const e = selected.to ? format(selected.to, "yyyy-MM-dd") : s;
              onDateChange(s, e);
              if (selected.to) setOpen(false);
            }}
            numberOfMonths={1}
            initialFocus
            className="pointer-events-auto"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default DateRangeFilter;
