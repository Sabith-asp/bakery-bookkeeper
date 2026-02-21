import { useState } from "react";
import { format, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from "date-fns";
import { CalendarIcon } from "lucide-react";
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
  const [fromOpen, setFromOpen] = useState(false);
  const [toOpen, setToOpen] = useState(false);

  const fromDate = startDate ? new Date(startDate + "T00:00:00") : undefined;
  const toDate = endDate ? new Date(endDate + "T00:00:00") : undefined;

  const activePreset = presets.find((p) => {
    const [s, e] = p.getRange();
    return s === startDate && e === endDate;
  });

  return (
    <div className="space-y-3">
      {/* Preset chips */}
      <div className="flex flex-wrap gap-2">
        {presets.map((preset) => (
          <Button
            key={preset.label}
            variant={activePreset?.label === preset.label ? "default" : "outline"}
            size="sm"
            className="h-7 text-xs rounded-full"
            onClick={() => {
              const [s, e] = preset.getRange();
              onDateChange(s, e);
            }}
          >
            {preset.label}
          </Button>
        ))}
      </div>

      {/* Custom date pickers */}
      <div className="flex items-center gap-2">
        <Popover open={fromOpen} onOpenChange={setFromOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "flex-1 justify-start text-left text-xs font-normal h-9",
                !fromDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
              {fromDate ? format(fromDate, "MMM d, yyyy") : "From date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={fromDate}
              onSelect={(date) => {
                if (date) {
                  onDateChange(format(date, "yyyy-MM-dd"), endDate);
                  setFromOpen(false);
                }
              }}
              initialFocus
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>

        <span className="text-xs text-muted-foreground">to</span>

        <Popover open={toOpen} onOpenChange={setToOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "flex-1 justify-start text-left text-xs font-normal h-9",
                !toDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
              {toDate ? format(toDate, "MMM d, yyyy") : "To date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              selected={toDate}
              onSelect={(date) => {
                if (date) {
                  onDateChange(startDate, format(date, "yyyy-MM-dd"));
                  setToOpen(false);
                }
              }}
              initialFocus
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};

export default DateRangeFilter;
