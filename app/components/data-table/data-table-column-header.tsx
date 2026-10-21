import { ArrowDownIcon, ArrowUpIcon, ChevronsUpDownIcon } from "lucide-react"
import { Button } from "~/components/ui/button"
import { cn } from "~/lib/utils"
import type { DataTableColumn, SortDirection } from "~/lib/datatable/types"

type DataTableColumnHeaderProps<TRow, TField extends string> = {
  column: DataTableColumn<TRow, TField>
  direction?: SortDirection
  onToggleSort: (field: TField) => void
}

/**
 * Renders a plain label for unsortable columns and a toggle button otherwise.
 * Direction is announced via `aria-sort` on the parent `th`, so the button keeps
 * its visible label as its accessible name.
 */
export function DataTableColumnHeader<TRow, TField extends string>({
  column,
  direction,
  onToggleSort,
}: DataTableColumnHeaderProps<TRow, TField>) {
  const { header, sortField } = column

  if (!sortField) {
    return (
      <span className="text-xs font-medium text-muted-foreground">
        {header}
      </span>
    )
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={() => onToggleSort(sortField)}
      className={cn(
        "-ms-2 h-8 px-2 font-medium data-[active=true]:bg-muted",
        !direction && "text-muted-foreground"
      )}
      data-active={direction !== undefined}
    >
      {header}
      {direction === "asc" ? (
        <ArrowUpIcon className="size-3.5" />
      ) : direction === "desc" ? (
        <ArrowDownIcon className="size-3.5" />
      ) : (
        <ChevronsUpDownIcon className="size-3.5 opacity-60" />
      )}
    </Button>
  )
}
