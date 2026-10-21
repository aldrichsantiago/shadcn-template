import { createContext, useContext } from "react"
import type { RowSelection } from "./use-row-selection"

/**
 * Gives components rendered inside the table (row actions, for instance) access to
 * the table's selection, so a mutation can drop the rows it deleted. Null outside
 * a `<DataTable>`.
 */
export const RowSelectionContext = createContext<RowSelection | null>(null)

export function useRowSelectionContext(): RowSelection | null {
  return useContext(RowSelectionContext)
}
