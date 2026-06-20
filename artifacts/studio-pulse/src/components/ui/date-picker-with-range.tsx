import * as React from "react"
import {
  format,
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfYear,
  endOfYear,
  subYears,
  isSameDay,
} from "date-fns"
import { CalendarIcon } from "lucide-react"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface Preset {
  label: string
  shortLabel?: string
  range: () => DateRange
}

const PRESETS: Preset[] = [
  {
    label: "This Month",
    range: () => ({ from: startOfMonth(new Date()), to: new Date() }),
  },
  {
    label: "Last Month",
    range: () => {
      const d = subMonths(new Date(), 1)
      return { from: startOfMonth(d), to: endOfMonth(d) }
    },
  },
  {
    label: "Last 3 Months",
    shortLabel: "3 Months",
    range: () => ({
      from: startOfMonth(subMonths(new Date(), 3)),
      to: endOfMonth(subMonths(new Date(), 1)),
    }),
  },
  {
    label: "Last 6 Months",
    shortLabel: "6 Months",
    range: () => ({
      from: startOfMonth(subMonths(new Date(), 6)),
      to: endOfMonth(subMonths(new Date(), 1)),
    }),
  },
  {
    label: "This Year",
    range: () => ({ from: startOfYear(new Date()), to: new Date() }),
  },
  {
    label: "Last Year",
    range: () => {
      const y = subYears(new Date(), 1)
      return { from: startOfYear(y), to: endOfYear(y) }
    },
  },
]

function detectPreset(range: DateRange | undefined): string | null {
  if (!range?.from || !range?.to) return null
  for (const preset of PRESETS) {
    const r = preset.range()
    if (
      r.from &&
      r.to &&
      isSameDay(range.from, r.from) &&
      isSameDay(range.to, r.to)
    ) {
      return preset.label
    }
  }
  return null
}

interface DatePickerWithRangeProps {
  value?: DateRange
  onChange?: (range: DateRange | undefined) => void
  className?: string
}

export function DatePickerWithRange({
  value,
  onChange,
  className,
}: DatePickerWithRangeProps) {
  const [open, setOpen] = React.useState(false)
  const [date, setDate] = React.useState<DateRange | undefined>(value)
  const [activePreset, setActivePreset] = React.useState<string | null>(
    () => detectPreset(value)
  )

  React.useEffect(() => {
    setDate(value)
    setActivePreset(detectPreset(value))
  }, [value])

  const handlePreset = (preset: Preset) => {
    const range = preset.range()
    setDate(range)
    setActivePreset(preset.label)
    onChange?.(range)
    setOpen(false)
  }

  const handleCalendarSelect = (range: DateRange | undefined) => {
    setDate(range)
    setActivePreset(null)
    if (range?.from && range?.to) {
      onChange?.(range)
    }
  }

  const triggerLabel = React.useMemo(() => {
    if (!date?.from) return "Pick a date range"
    if (activePreset) return activePreset
    if (date.to) {
      return `${format(date.from, "MMM d, y")} – ${format(date.to, "MMM d, y")}`
    }
    return format(date.from, "MMM d, y")
  }, [date, activePreset])

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
            <span className="truncate">{triggerLabel}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-0 shadow-xl"
          align="start"
          sideOffset={4}
        >
          <div className="flex divide-x divide-slate-100">
            <div className="flex flex-col gap-0.5 p-3 min-w-[148px] bg-slate-50/60">
              <p className="px-2 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Quick Select
              </p>
              {PRESETS.map((preset) => {
                const active = activePreset === preset.label
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => handlePreset(preset)}
                    className={cn(
                      "w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition-all duration-150",
                      active
                        ? "bg-slate-900 text-white shadow-sm"
                        : "text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-sm"
                    )}
                  >
                    {preset.label}
                  </button>
                )
              })}
              <div className="mt-2 border-t border-slate-200 pt-2">
                <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Custom Range
                </p>
                {date?.from && date?.to && !activePreset && (
                  <div className="px-3 py-1.5 rounded-lg bg-blue-50 text-xs text-blue-700 font-medium">
                    {format(date.from, "MMM d")} – {format(date.to, "MMM d, y")}
                  </div>
                )}
                {!date?.from && (
                  <p className="px-3 text-xs text-slate-400">
                    Click days on the calendar →
                  </p>
                )}
              </div>
            </div>
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={date?.from}
              selected={date}
              onSelect={handleCalendarSelect}
              numberOfMonths={2}
              className="p-3 pointer-events-auto"
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
