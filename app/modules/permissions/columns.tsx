import { Badge } from "~/components/ui/badge"
import { ACTION_LABELS, ENTITY_LABELS } from "~/lib/auth/permissions"
import type { DataTableColumn } from "~/lib/datatable/types"
import type { PermissionRow, PermissionSortField } from "./types"

export const permissionColumns: DataTableColumn<
  PermissionRow,
  PermissionSortField
>[] = [
  {
    id: "permission",
    header: "Permission",
    headerClassName: "w-[30%]",
    cell: (row) => (
      <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
        {row.id}
      </code>
    ),
  },
  {
    id: "entity",
    header: "Entity",
    sortField: "entity",
    cell: (row) => <Badge variant="outline">{ENTITY_LABELS[row.entity]}</Badge>,
  },
  {
    id: "action",
    header: "Action",
    sortField: "action",
    cell: (row) => ACTION_LABELS[row.action],
  },
  {
    id: "description",
    header: "Description",
    className: "text-muted-foreground",
    cell: (row) => row.description,
  },
]
