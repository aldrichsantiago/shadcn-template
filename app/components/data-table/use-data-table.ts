import { useCallback, useMemo } from "react"
import { useNavigate, useNavigation, useSearchParams } from "react-router"
import { parseListParams, serializeListParams } from "~/lib/datatable/params"
import type {
  ListParams,
  ListQuerySchema,
  SortDirection,
} from "~/lib/datatable/types"

/**
 * Everything the datatable UI needs to read and mutate list state. The URL is the
 * source of truth, so params are parsed from it (not from loader data) — controls
 * update immediately and navigation stays shareable/bookmarkable.
 */
export type DataTableController<TField extends string> = {
  params: ListParams<TField>
  /** True while a navigation to the next page of results is in flight. */
  isLoading: boolean
  setPage: (page: number) => void
  setPerPage: (perPage: number) => void
  setSearch: (search: string) => void
  toggleSort: (field: TField) => void
  setFilterValues: (key: string, values: string[]) => void
  toggleFilterValue: (key: string, value: string) => void
  clearFilter: (key: string) => void
  clearAllFilters: () => void
  reset: () => void
  getSortDirection: (field: TField) => SortDirection | undefined
  activeFilterCount: number
}

export function useDataTable<TField extends string>(
  schema: ListQuerySchema<TField>
): DataTableController<TField> {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const navigation = useNavigation()

  // Memoized so the callbacks below keep stable identities across renders. The
  // search input's debounce relies on that: a new `onSearch` every render would
  // restart its timer continuously and the request would never fire.
  const params = useMemo(
    () => parseListParams(searchParams, schema),
    [searchParams, schema]
  )

  const commit = useCallback(
    (
      next: ListParams<TField>,
      options?: { replace?: boolean; keepScroll?: boolean }
    ) => {
      const search = serializeListParams(next, schema, searchParams).toString()
      void navigate(
        { search: search ? `?${search}` : "" },
        {
          replace: options?.replace ?? false,
          // Typing in search must not yank the viewport back to the top.
          preventScrollReset: options?.keepScroll ?? false,
        }
      )
    },
    [navigate, schema, searchParams]
  )

  const setPage = useCallback(
    (page: number) => commit({ ...params, page }),
    [commit, params]
  )

  const setPerPage = useCallback(
    (perPage: number) => commit({ ...params, perPage, page: 1 }),
    [commit, params]
  )

  const setSearch = useCallback(
    (search: string) =>
      commit(
        { ...params, search, page: 1 },
        { replace: true, keepScroll: true }
      ),
    [commit, params]
  )

  /**
   * Standard header cycle: unsorted -> asc -> desc -> unsorted. Clicking a header
   * resets to a single sort column; multi-column sort stays available via the URL.
   * Clearing removes the param so the module's `defaultSort` applies again.
   */
  const toggleSort = useCallback(
    (field: TField) => {
      const onlySort = params.sort.length === 1 ? params.sort[0] : undefined
      const direction =
        onlySort?.field === field ? onlySort.direction : undefined

      const sort =
        direction === undefined
          ? [{ field, direction: "asc" as const }]
          : direction === "asc"
            ? [{ field, direction: "desc" as const }]
            : []

      commit({ ...params, sort, page: 1 })
    },
    [commit, params]
  )

  const setFilterValues = useCallback(
    (key: string, values: string[]) => {
      const filters = { ...params.filters }
      if (values.length === 0) delete filters[key]
      else filters[key] = values

      commit({ ...params, filters, page: 1 })
    },
    [commit, params]
  )

  const toggleFilterValue = useCallback(
    (key: string, value: string) => {
      const current = params.filters[key] ?? []
      const next = current.includes(value)
        ? current.filter((entry) => entry !== value)
        : [...current, value]
      setFilterValues(key, next)
    },
    [params.filters, setFilterValues]
  )

  const clearFilter = useCallback(
    (key: string) => setFilterValues(key, []),
    [setFilterValues]
  )

  const clearAllFilters = useCallback(
    () => commit({ ...params, filters: {}, page: 1 }),
    [commit, params]
  )

  const reset = useCallback(
    () =>
      commit(
        { ...params, search: "", filters: {}, sort: [], page: 1 },
        { keepScroll: true }
      ),
    [commit, params]
  )

  const getSortDirection = useCallback(
    (field: TField) =>
      params.sort.find((sort) => sort.field === field)?.direction,
    [params.sort]
  )

  return {
    params,
    isLoading: navigation.state !== "idle",
    setPage,
    setPerPage,
    setSearch,
    toggleSort,
    setFilterValues,
    toggleFilterValue,
    clearFilter,
    clearAllFilters,
    reset,
    getSortDirection,
    activeFilterCount: Object.keys(params.filters).length,
  }
}
