import type { ReactNode } from "react"
import { XIcon } from "lucide-react"
import { Button } from "~/components/ui/button"
import { Separator } from "~/components/ui/separator"

type DataTableActionBarProps = {
  count: number
  onClear: () => void
  /** Module-supplied actions, e.g. a batch delete button. */
  children?: ReactNode
}

/**
 * Floating bar pinned to the bottom-centre of the table. Only rendered while a
 * multi-row selection exists, so it never covers rows for nothing.
 */
export function DataTableActionBar({
  count,
  onClear,
  children,
}: DataTableActionBarProps) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-10 flex justify-center px-4">
      <div className="pointer-events-auto flex animate-in items-center gap-2 rounded-3xl bg-popover py-1.5 ps-4 pe-1.5 text-sm text-popover-foreground shadow-lg ring-1 ring-foreground/5 duration-150 fade-in-0 slide-in-from-bottom-2">
        <span role="status" className="font-medium">
          <Button
            type="button"
            variant="ghost"
            onClick={onClear}
            aria-label="Clear selection"
            title="Clear selection"
          >
            {count} selected
            <XIcon className="size-3.5" />
          </Button>
        </span>

        {children && (
          <>
            <Separator orientation="vertical" className="h-8" />
            <div className="flex items-center gap-1">{children}</div>
          </>
        )}
      </div>
    </div>
  )
}
