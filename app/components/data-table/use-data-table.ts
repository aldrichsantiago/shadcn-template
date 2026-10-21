import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useFetcher, useLocation } from "react-router"
import { parseListParams, serializeListParams } from "~/lib/datatable/params"
import type {
  DateRange,
  ListParams,
  ListQuerySchema,
  Page,
  SortDirection,
  SortParam,
} from "~/lib/datatable/types"

/**
 * Everything the datatable UI needs to read and mutate list state.
 *
 * List state lives in React state, not the URL: controls update the controller,
 * which asks the route loader for a page with `fetcher.load`. The address bar
 * never changes, so filtered views are not shareable — a deliberate trade-off to
 * keep URLs stable.
 */
export type DataTableController<TField extends string> = {
  params: ListParams<TField>
  /** True while the next page of results is in flight. */
  isLoading: boolean
  setPage: (page: number) => void
  setPerPage: (perPage: number) => void
  setSearch: (search: string) => void
  toggleSort: (field: TField) => void
  setFilterValues: (key: string, values: string[]) => void
  toggleFilterValue: (key: string, value: string) => void
  clearFilter: (key: string) => void
  setDateRange: (key: string, range: DateRange) => void
  clearDateRange: (key: string) => void
  clearAllFilters: () => void
  reset: () => void
  getSortDirection: (field: TField) => SortDirection | undefined
  activeFilterCount: number
}

export type DataTableQuery<TRow, TField extends string> = {
  controller: DataTableController<TField>
  /** Latest page: the fetched one once it exists, otherwise the SSR seed. */
  result: Page<TRow>
  isLoading: boolean
}

/**
 * `initialResult` is the server-rendered first page and only a seed. When params
 * change, or a mutation revalidates the route (which produces a new seed object),
 * the datatable refetches with its own params.
 */
export function useDataTable<TRow, TField extends string>(
  schema: ListQuerySchema<TField>,
  initialResult: Page<TRow>
): DataTableQuery<TRow, TField> {
  const { pathname } = useLocation()
  const fetcher = useFetcher<Page<TRow>>()

  const [params, setParams] = useState<ListParams<TField>>(() =>
    parseListParams(new URLSearchParams(), schema)
  )

  const update = useCallback(
    (updater: (current: ListParams<TField>) => ListParams<TField>): void => {
      setParams(updater)
    },
    []
  )

  // Memoized so the request effect only fires when the request changes.
  const url = useMemo(() => {
    const search = serializeListParams(params, schema).toString()
    return search ? `${pathname}?${search}` : pathname
  }, [params, pathname, schema])

  const requestedUrlRef = useRef<string | null>(null)
  const seededResultRef = useRef(initialResult)

  useEffect(() => {
    const seedChanged = seededResultRef.current !== initialResult
    seededResultRef.current = initialResult

    if (!seedChanged && requestedUrlRef.current === url) return

    requestedUrlRef.current = url
    void fetcher.load(url)
  }, [fetcher, initialResult, url])

  const setPage = useCallback(
    (page: number) => update((current) => ({ ...current, page })),
    [update]
  )

  const setPerPage = useCallback(
    (perPage: number) =>
      update((current) => ({ ...current, perPage, page: 1 })),
    [update]
  )

  const setSearch = useCallback(
    (search: string) => update((current) => ({ ...current, search, page: 1 })),
    [update]
  )

  /**
   * Standard header cycle: unsorted -> asc -> desc -> unsorted. Clicking a header
   * resets to a single sort column; clearing restores the schema's default sort,
   * which the serializer then omits again.
   */
  const toggleSort = useCallback(
    (field: TField) =>
      update((current) => {
        const onlySort = current.sort.length === 1 ? current.sort[0] : undefined
        const direction =
          onlySort?.field === field ? onlySort.direction : undefined

        const sort: SortParam<TField>[] =
          direction === undefined
            ? [{ field, direction: "asc" }]
            : direction === "asc"
              ? [{ field, direction: "desc" }]
              : []

        return { ...current, sort, page: 1 }
      }),
    [update]
  )

  const setFilterValues = useCallback(
    (key: string, values: string[]) =>
      update((current) => {
        const filters = { ...current.filters }
        if (values.length === 0) delete filters[key]
        else filters[key] = values
        return { ...current, filters, page: 1 }
      }),
    [update]
  )

  const toggleFilterValue = useCallback(
    (key: string, value: string) =>
      update((current) => {
        const selected = current.filters[key] ?? []
        const values = selected.includes(value)
          ? selected.filter((entry) => entry !== value)
          : [...selected, value]

        const filters = { ...current.filters }
        if (values.length === 0) delete filters[key]
        else filters[key] = values
        return { ...current, filters, page: 1 }
      }),
    [update]
  )

  const clearFilter = useCallback(
    (key: string) => setFilterValues(key, []),
    [setFilterValues]
  )

  const setDateRange = useCallback(
    (key: string, range: DateRange) =>
      update((current) => {
        const dateRanges = { ...current.dateRanges }
        if (!range.from && !range.to) delete dateRanges[key]
        else dateRanges[key] = range
        return { ...current, dateRanges, page: 1 }
      }),
    [update]
  )

  const clearDateRange = useCallback(
    (key: string) => setDateRange(key, {}),
    [setDateRange]
  )

  const clearAllFilters = useCallback(
    () =>
      update((current) => ({
        ...current,
        filters: {},
        dateRanges: {},
        page: 1,
      })),
    [update]
  )

  const reset = useCallback(
    () => setParams(parseListParams(new URLSearchParams(), schema)),
    [schema]
  )

  const getSortDirection = useCallback(
    (field: TField) =>
      params.sort.find((sort) => sort.field === field)?.direction,
    [params.sort]
  )

  const isLoading = fetcher.state !== "idle"

  return {
    controller: {
      params,
      isLoading,
      setPage,
      setPerPage,
      setSearch,
      toggleSort,
      setFilterValues,
      toggleFilterValue,
      clearFilter,
      setDateRange,
      clearDateRange,
      clearAllFilters,
      reset,
      getSortDirection,
      activeFilterCount:
        Object.keys(params.filters).length +
        Object.keys(params.dateRanges).length,
    },
    result: fetcher.data ?? initialResult,
    isLoading,
  }
}
