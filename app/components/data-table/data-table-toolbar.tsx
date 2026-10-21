import { useEffect, useRef, useState, type ReactNode } from "react"
import { SearchIcon, XIcon } from "lucide-react"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import type { DataTableFilter } from "~/lib/datatable/types"
import { DataTableFacetedFilter } from "./data-table-faceted-filter"
import type { DataTableController } from "./use-data-table"

const SEARCH_DEBOUNCE_MS = 600

type DataTableSearchInputProps = {
  value: string
  onSearch: (value: string) => void
  placeholder: string
}

/**
 * Debounced so we do not hit the server on every keystroke.
 *
 * The input is deliberately never disabled while a request is in flight: disabling
 * it the moment the debounced navigation starts blurs the field and destroys the
 * caret, so typing stops after the first pause. Focus and caret belong to the user.
 *
 * `committedRef` marks the value we last sent. The URL only catches up once the
 * loader resolves, so a plain `setDraft(value)` sync would rewind the input (and
 * its caret) to a stale query while the user is still typing. We therefore adopt
 * `value` only when it is not our own echo.
 */
function DataTableSearchInput({
  value,
  onSearch,
  placeholder,
}: DataTableSearchInputProps) {
  const [draft, setDraft] = useState(value)
  const committedRef = useRef(value)

  useEffect(() => {
    if (value === committedRef.current) return
    // Something other than this input changed the query (back/forward, reset, a
    // link). Adopt it, otherwise the field would keep showing a stale search.
    committedRef.current = value
    setDraft(value)
  }, [value])

  useEffect(() => {
    if (draft === value) return
    const timer = setTimeout(() => {
      committedRef.current = draft
      onSearch(draft)
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [draft, value, onSearch])

  return (
    <div className="relative">
      <SearchIcon className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-8 w-full ps-9 sm:w-64"
      />
    </div>
  )
}

type DataTableToolbarProps<TField extends string> = {
  controller: DataTableController<TField>
  filters?: readonly DataTableFilter[]
  searchPlaceholder?: string
  /** Module-specific actions (e.g. a "Create user" button). */
  children?: ReactNode
}

export function DataTableToolbar<TField extends string>({
  controller,
  filters = [],
  searchPlaceholder = "Search…",
  children,
}: DataTableToolbarProps<TField>) {
  const { params, setSearch, toggleFilterValue, clearFilter, clearAllFilters } =
    controller
  const hasFilters = filters.length > 0

  return (
    <div className="flex flex-col gap-2 p-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-1 flex-wrap items-center gap-2">
        <DataTableSearchInput
          value={params.search}
          onSearch={setSearch}
          placeholder={searchPlaceholder}
        />

        {hasFilters &&
          filters.map((filter) => (
            <DataTableFacetedFilter
              key={filter.key}
              filter={filter}
              selected={params.filters[filter.key] ?? []}
              onToggleValue={(value) => toggleFilterValue(filter.key, value)}
              onClear={() => clearFilter(filter.key)}
            />
          ))}

        {controller.activeFilterCount > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
          >
            Reset
            <XIcon className="size-3.5" />
          </Button>
        )}
      </div>

      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  )
}
