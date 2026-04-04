import { useState } from "react";
import { format, subDays, parseISO } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

interface DatePickerDrawerProps {
  value: string; // yyyy-MM-dd
  onChange: (date: string) => void;
  accentClass?: string;
}

const DatePickerDrawer = ({ value, onChange, accentClass }: DatePickerDrawerProps) => {
  const [open, setOpen] = useState(false);

  const selected = value ? parseISO(value) : new Date();

  const handleSelect = (date: Date | undefined) => {
    if (!date) return;
    onChange(format(date, "yyyy-MM-dd"));
    setOpen(false);
  };

  const today = format(new Date(), "yyyy-MM-dd");
  const yesterday = format(subDays(new Date(), 1), "yyyy-MM-dd");

  const olderDates = Array.from({ length: 5 }, (_, i) => {
    const d = subDays(new Date(), i + 2);
    return { label: format(d, "EEE d"), value: format(d, "yyyy-MM-dd") };
  });

  const isOtherDate = value !== today && value !== yesterday;
  const displayDate = value ? format(parseISO(value), "EEE, d MMM yyyy") : "Pick a date";

  return (
    <div className="space-y-2">
      {/* Today / Yesterday — always visible */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: "Today", value: today },
          { label: "Yesterday", value: yesterday },
        ].map((d) => (
          <button
            key={d.value}
            type="button"
            onClick={() => onChange(d.value)}
            className={cn(
              "py-2.5 text-sm font-semibold rounded-xl border transition-all",
              value === d.value
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-background text-foreground border-border hover:border-primary/40"
            )}
          >
            {d.label}
          </button>
        ))}
      </div>

      {/* Trigger button — opens drawer for other dates */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "flex w-full items-center gap-2 h-11 px-3 rounded-lg border text-sm font-medium transition-all",
          isOtherDate
            ? "border-primary bg-primary/5 text-foreground"
            : "border-border bg-background text-muted-foreground",
          accentClass ? `hover:${accentClass}` : "hover:border-primary/40"
        )}
      >
        <CalendarIcon className="h-4 w-4 text-muted-foreground shrink-0" />
        <span>{isOtherDate ? displayDate : "Other date..."}</span>
      </button>

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="pb-safe">
          <DrawerHeader className="pb-2">
            <DrawerTitle>Select Date</DrawerTitle>
          </DrawerHeader>

          {/* Older quick-date chips */}
          <div className="flex gap-2 overflow-x-auto px-4 pb-4 scrollbar-hide">
            {olderDates.map((d) => (
              <button
                key={d.value}
                type="button"
                onClick={() => handleSelect(parseISO(d.value))}
                className={cn(
                  "shrink-0 px-4 py-2 text-xs font-medium rounded-lg border transition-all",
                  value === d.value
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-background text-muted-foreground border-border hover:border-primary/40"
                )}
              >
                {d.label}
              </button>
            ))}
          </div>

          {/* Calendar */}
          <div className="px-2 pb-8">
            <Calendar
              mode="single"
              selected={selected}
              onSelect={handleSelect}
              disabled={(date) => date > new Date()}
              initialFocus
              classNames={{
                months: "flex flex-col w-full",
                month: "w-full",
                caption: "flex justify-center pt-1 pb-3 relative items-center",
                caption_label: "text-base font-semibold",
                nav: "space-x-1 flex items-center",
                nav_button: "h-9 w-9 bg-transparent p-0 opacity-60 hover:opacity-100 flex items-center justify-center rounded-md border border-border",
                nav_button_previous: "absolute left-1",
                nav_button_next: "absolute right-1",
                table: "w-full",
                head_row: "flex mb-1",
                head_cell: "text-muted-foreground flex-1 font-medium text-xs text-center py-2",
                row: "flex w-full mb-1",
                cell: "flex-1 text-center p-0.5 relative focus-within:relative focus-within:z-20",
                day: "h-11 w-full p-0 text-sm font-normal rounded-xl hover:bg-accent transition-colors aria-selected:opacity-100",
                day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                day_today: "bg-accent text-accent-foreground font-bold",
                day_outside: "text-muted-foreground opacity-30",
                day_disabled: "text-muted-foreground opacity-25 cursor-not-allowed",
                day_hidden: "invisible",
              }}
            />
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default DatePickerDrawer;
