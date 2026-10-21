import { useCallback, useMemo, useState } from "react"

export type RowSelection = {
  /** Ids selected so far, including rows from pages that are no longer loaded. */
  selectedIds: ReadonlySet<string>
  selectedCount: number
  isSelected: (id: string) => boolean
  toggleRow: (id: string) => void
  /** Adds every row on the current page, or removes them if all are selected. */
  toggleAllOnPage: () => void
  /** Drops ids from the selection, e.g. after those rows were deleted. */
  remove: (ids: Iterable<string>) => void
  clear: () => void
  isAllOnPageSelected: boolean
  isSomeOnPageSelected: boolean
}

/**
 * Row selection for a server-paginated table.
 *
 * Selection is keyed by row id and stored independently of `rows`, which is what
 * makes it survive pagination: only the current page is ever in memory, so
 * deriving selection from `rows` would drop everything on every page change.
 *
 * Selection deliberately outlives filter/sort/search changes too — a bulk action
 * usually spans the current query. Use `clear()` to reset it.
 */
export function useRowSelection<TRow>({
  rows,
  getRowId,
}: {
  rows: readonly TRow[]
  getRowId: (row: TRow) => string
}): RowSelection {
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(
    () => new Set()
  )

  const pageIds = useMemo(() => rows.map(getRowId), [rows, getRowId])

  const toggleRow = useCallback((id: string) => {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const toggleAllOnPage = useCallback(() => {
    setSelectedIds((current) => {
      const next = new Set(current)
      const allOnPageSelected =
        pageIds.length > 0 && pageIds.every((id) => next.has(id))

      for (const id of pageIds) {
        if (allOnPageSelected) next.delete(id)
        else next.add(id)
      }
      return next
    })
  }, [pageIds])

  const remove = useCallback((ids: Iterable<string>) => {
    setSelectedIds((current) => {
      let next: Set<string> | null = null
      for (const id of ids) {
        if (!current.has(id)) continue
        next ??= new Set(current)
        next.delete(id)
      }
      // Same Set when nothing was selected, so consumers do not re-render.
      return next ?? current
    })
  }, [])

  const clear = useCallback(() => {
    setSelectedIds((current) => (current.size === 0 ? current : new Set()))
  }, [])

  const isSelected = useCallback(
    (id: string) => selectedIds.has(id),
    [selectedIds]
  )

  const isAllOnPageSelected =
    pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id))
  const isSomeOnPageSelected =
    !isAllOnPageSelected && pageIds.some((id) => selectedIds.has(id))

  return {
    selectedIds,
    selectedCount: selectedIds.size,
    isSelected,
    toggleRow,
    toggleAllOnPage,
    remove,
    clear,
    isAllOnPageSelected,
    isSomeOnPageSelected,
  }
}
