import { useEffect, useState } from "react"
import { CalendarRangeIcon, XIcon } from "lucide-react"
import { Badge } from "~/components/ui/badge"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover"
import { Separator } from "~/components/ui/separator"
import type { DataTableDateFilter, DateRange } from "~/lib/datatable/types"

const DAY_MS = 86_400_000

function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function daysAgo(days: number): string {
  return isoDay(new Date(Date.now() - days * DAY_MS))
}

/**
 * Presets are computed on click, not at render, so SSR markup never contains a
 * date that could drift from the client's clock.
 */
const PRESETS: readonly { label: string; range: () => DateRange }[] = [
  {
    label: "Last 7 days",
    range: () => ({ from: daysAgo(6), to: isoDay(new Date()) }),
  },
  {
    label: "Last 30 days",
    range: () => ({ from: daysAgo(29), to: isoDay(new Date()) }),
  },
  {
    label: "Last 90 days",
    range: () => ({ from: daysAgo(89), to: isoDay(new Date()) }),
  },
  {
    label: "This year",
    range: () => ({
      from: `${new Date().getUTCFullYear()}-01-01`,
      to: isoDay(new Date()),
    }),
  },
]

function summarize(range: DateRange | undefined): string | null {
  if (!range?.from && !range?.to) return null
  if (range.from && range.to) return `${range.from} → ${range.to}`
  return range.from ? `Since ${range.from}` : `Until ${range.to}`
}

type DataTableDateRangeFilterProps = {
  filter: DataTableDateFilter
  value: DateRange | undefined
  onChange: (range: DateRange) => void
  onClear: () => void
}

/**
 * Inclusive day range filter. Uses native `<input type="date">` rather than a
 * calendar dependency: keyboard/screen-reader support comes free and the bundle
 * stays small.
 */
export function DataTableDateRangeFilter({
  filter,
  value,
  onChange,
  onClear,
}: DataTableDateRangeFilterProps) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<DateRange>(value ?? {})

  // Adopt external changes (preset applied elsewhere, "Reset", a cleared filter).
  useEffect(() => {
    setDraft(value ?? {})
  }, [value])

  const summary = summarize(value)

  const apply = (range: DateRange) => {
    onChange({ from: range.from || undefined, to: range.to || undefined })
    setOpen(false)
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        // Closing without Apply discards the draft, so reopening never shows
        // values that are not actually filtering the table.
        if (!next) setDraft(value ?? {})
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="border-dashed"
        >
          <CalendarRangeIcon className="size-3.5" />
          {filter.label}
          {summary && (
            <>
              <Separator orientation="vertical" className="mx-0.5 h-4" />
              <Badge
                variant="secondary"
                className="rounded-3xl px-1.5 font-normal"
              >
                {summary}
              </Badge>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((preset) => (
              <Button
                key={preset.label}
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => apply(preset.range())}
              >
                {preset.label}
              </Button>
            ))}
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <Label htmlFor={`${filter.key}-from`} className="text-xs">
                From
              </Label>
              <Input
                id={`${filter.key}-from`}
                type="date"
                value={draft.from ?? ""}
                max={draft.to}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    from: event.target.value || undefined,
                  }))
                }
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor={`${filter.key}-to`} className="text-xs">
                To
              </Label>
              <Input
                id={`${filter.key}-to`}
                type="date"
                value={draft.to ?? ""}
                min={draft.from}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    to: event.target.value || undefined,
                  }))
                }
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setDraft({})
                onClear()
                setOpen(false)
              }}
              disabled={!summary}
            >
              <XIcon className="size-3.5" />
              Clear
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => apply(draft)}
              disabled={!draft.from && !draft.to}
            >
              Apply
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
