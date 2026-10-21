import type { ReactNode } from "react"
import { PlusIcon } from "lucide-react"
import { Button } from "~/components/ui/button"
import { Checkbox } from "~/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table"
import { can, type Permission } from "~/lib/auth/permissions"
import { useCurrentUser } from "~/lib/auth/use-current-user"
import type {
  DataTableColumn,
  DataTableDateFilter,
  DataTableFilter,
  ListQuerySchema,
  Page,
} from "~/lib/datatable/types"
import { cn } from "~/lib/utils"
import { DataTableActionBar } from "./data-table-action-bar"
import { DataTableColumnHeader } from "./data-table-column-header"
import { DataTablePagination } from "./data-table-pagination"
import { DataTableToolbar } from "./data-table-toolbar"
import { RowSelectionContext } from "./row-selection-context"
import { useDataTable } from "./use-data-table"
import { useRowSelection, type RowSelection } from "./use-row-selection"

type DataTableProps<TRow, TField extends string> = {
  columns: readonly DataTableColumn<TRow, TField>[]
  /** Server-rendered first page. Refetches happen client-side from here. */
  initialResult: Page<TRow>
  schema: ListQuerySchema<TField>
  /** Stable row key. Required: row selection and React keys both depend on it. */
  getRowId: (row: TRow) => string
  filters?: readonly DataTableFilter[]
  dateFilters?: readonly DataTableDateFilter[]
  searchPlaceholder?: string
  emptyMessage?: ReactNode
  /** Plural noun used in the pagination summary, e.g. "users". */
  itemLabel?: string
  /** Module-specific toolbar actions. */
  toolbarActions?: ReactNode
  /**
   * Primary create action in the toolbar. Rendered only when the current user
   * holds `permission`, so modules never hand-roll the check.
   */
  addAction?: {
    label: string
    permission: Permission
    onClick: () => void
  }
  /** Adds a leading checkbox column. The selection survives pagination. */
  enableRowSelection?: boolean
  /** Accessible name per row, e.g. `(user) => user.name`. */
  getRowLabel?: (row: TRow) => string
  /** Bulk actions for the floating action bar (shown from 2 selected rows up). */
  selectionActions?: (selection: RowSelection) => ReactNode
}

/**
 * Server-backed datatable with client-owned list state.
 *
 * List params live in `useDataTable` (not the URL); each change asks the route
 * loader for a page through a fetcher, so the address bar stays clean while
 * mutations still revalidate and refetch through React Router.
 */
export function DataTable<TRow, TField extends string>({
  columns,
  initialResult,
  schema,
  getRowId,
  filters,
  dateFilters,
  searchPlaceholder,
  emptyMessage = "No results.",
  itemLabel,
  toolbarActions,
  addAction,
  enableRowSelection = false,
  getRowLabel,
  selectionActions,
}: DataTableProps<TRow, TField>) {
  const { controller, result, isLoading } = useDataTable(schema, initialResult)
  const { getSortDirection } = controller
  const { rows, total, page, pageCount, perPage } = result
  const currentUser = useCurrentUser()
  const showAdd =
    addAction && can(currentUser.permissions, addAction.permission)

  // Always called to keep hook order stable; the work is trivial when the module
  // does not opt into selection.
  const selection = useRowSelection({ rows, getRowId })
  const columnCount = columns.length + (enableRowSelection ? 1 : 0)

  return (
    // Cells render module components (row actions) that may delete their row and
    // must be able to drop it from the selection, which lives up here.
    <RowSelectionContext value={selection}>
      <div className="overflow-hidden rounded-xl border bg-card">
        <DataTableToolbar
          controller={controller}
          filters={filters}
          dateFilters={dateFilters}
          searchPlaceholder={searchPlaceholder}
        >
          {showAdd && (
            <Button type="button" size="sm" onClick={addAction.onClick}>
              <PlusIcon className="size-3.5" />
              {addAction.label}
            </Button>
          )}
          {toolbarActions}
        </DataTableToolbar>

        <div className="relative" aria-busy={isLoading}>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                {enableRowSelection && (
                  <TableHead className="w-10">
                    <Checkbox
                      checked={
                        selection.isAllOnPageSelected
                          ? true
                          : selection.isSomeOnPageSelected
                            ? "indeterminate"
                            : false
                      }
                      onCheckedChange={() => selection.toggleAllOnPage()}
                      disabled={rows.length === 0}
                      aria-label="Select all rows on this page"
                      title="Select all rows on this page"
                    />
                  </TableHead>
                )}
                {columns.map((column) => {
                  const direction = column.sortField
                    ? getSortDirection(column.sortField)
                    : undefined
                  return (
                    <TableHead
                      key={column.id}
                      className={column.headerClassName}
                      aria-sort={
                        direction === "asc"
                          ? "ascending"
                          : direction === "desc"
                            ? "descending"
                            : column.sortField
                              ? "none"
                              : undefined
                      }
                    >
                      <DataTableColumnHeader
                        column={column}
                        direction={direction}
                        onToggleSort={controller.toggleSort}
                      />
                    </TableHead>
                  )
                })}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columnCount}
                    className="h-32 text-center text-muted-foreground"
                  >
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => {
                  const rowId = getRowId(row)
                  return (
                    <TableRow
                      key={rowId}
                      data-state={
                        selection.isSelected(rowId) ? "selected" : undefined
                      }
                    >
                      {enableRowSelection && (
                        <TableCell className="w-10">
                          <Checkbox
                            checked={selection.isSelected(rowId)}
                            onCheckedChange={() => selection.toggleRow(rowId)}
                            aria-label={
                              getRowLabel
                                ? `Select ${getRowLabel(row)}`
                                : "Select row"
                            }
                          />
                        </TableCell>
                      )}
                      {columns.map((column) => (
                        <TableCell
                          key={column.id}
                          className={cn("py-3", column.className)}
                        >
                          {column.cell(row)}
                        </TableCell>
                      ))}
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>

          {/* Loading remains announced to assistive tech even though it is visual only. */}
          {isLoading && (
            <>
              <div
                className="absolute inset-0 bg-background/50"
                aria-hidden="true"
              />
              <span className="sr-only" role="status">
                Loading results
              </span>
            </>
          )}
        </div>

        <DataTablePagination
          controller={controller}
          total={total}
          page={page}
          pageCount={pageCount}
          perPage={perPage}
          perPageOptions={schema.perPageOptions}
          itemLabel={itemLabel}
        />
        {/* Multi-row only: a single row is deleted through its own row actions. */}
        {enableRowSelection && selection.selectedCount > 1 && (
          <DataTableActionBar
            count={selection.selectedCount}
            onClear={selection.clear}
          >
            {selectionActions?.(selection)}
          </DataTableActionBar>
        )}
      </div>
    </RowSelectionContext>
  )
}
