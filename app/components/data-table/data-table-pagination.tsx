import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
} from "lucide-react"
import { Button } from "~/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select"
import type { DataTableController } from "./use-data-table"

type DataTablePaginationProps<TField extends string> = {
  controller: DataTableController<TField>
  total: number
  page: number
  pageCount: number
  perPage: number
  perPageOptions: readonly number[]
  /** Plural noun shown in the range summary, e.g. "users". */
  itemLabel?: string
}

export function DataTablePagination<TField extends string>({
  controller,
  total,
  page,
  pageCount,
  perPage,
  perPageOptions,
  itemLabel = "results",
}: DataTablePaginationProps<TField>) {
  // Not disabled while loading: removing focus from the control the user just
  // activated loses their place. The table overlay already shows pending state.
  const { setPage, setPerPage } = controller
  const firstRow = total === 0 ? 0 : (page - 1) * perPage + 1
  const lastRow = Math.min(page * perPage, total)

  return (
    <div className="flex flex-col gap-3 border-t p-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {total === 0
          ? `No ${itemLabel}`
          : `Showing ${firstRow}–${lastRow} of ${total} ${itemLabel}`}
      </p>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="hidden text-sm text-muted-foreground sm:inline">
            Rows per page
          </span>
          <Select
            value={String(perPage)}
            onValueChange={(value) => setPerPage(Number(value))}
          >
            <SelectTrigger
              size="sm"
              className="w-[4.5rem]"
              aria-label="Rows per page"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {perPageOptions.map((option) => (
                <SelectItem key={option} value={String(option)}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <p className="text-sm font-medium">
          Page {page} of {pageCount}
        </p>

        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={() => setPage(1)}
            disabled={page <= 1}
            aria-label="Go to first page"
          >
            <ChevronsLeftIcon className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={() => setPage(page - 1)}
            disabled={page <= 1}
            aria-label="Go to previous page"
          >
            <ChevronLeftIcon className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={() => setPage(page + 1)}
            disabled={page >= pageCount}
            aria-label="Go to next page"
          >
            <ChevronRightIcon className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={() => setPage(pageCount)}
            disabled={page >= pageCount}
            aria-label="Go to last page"
          >
            <ChevronsRightIcon className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
