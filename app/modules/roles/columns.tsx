import { Badge } from "~/components/ui/badge"
import { ALL_PERMISSIONS } from "~/lib/auth/permissions"
import type { DataTableColumn } from "~/lib/datatable/types"
import { formatDate } from "~/lib/format"
import { RoleRowActions } from "./actions"
import type { Role, RoleSortField } from "./types"

export const roleColumns: DataTableColumn<Role, RoleSortField>[] = [
  {
    id: "name",
    header: "Role",
    sortField: "name",
    headerClassName: "w-[40%]",
    cell: (role) => (
      <div className="min-w-0">
        <div className="truncate font-medium">{role.name}</div>
        <div className="truncate text-xs text-muted-foreground">
          {role.description}
        </div>
      </div>
    ),
  },
  {
    id: "permissions",
    header: "Permissions",
    cell: (role) => (
      <Badge variant="secondary">
        {role.permissions.length === ALL_PERMISSIONS.length
          ? "All permissions"
          : `${role.permissions.length} granted`}
      </Badge>
    ),
  },
  {
    id: "createdAt",
    header: "Created",
    sortField: "createdAt",
    cell: (role) => formatDate(role.createdAt),
  },
  {
    id: "actions",
    header: "",
    headerClassName: "text-end",
    className: "text-end",
    cell: (role) => <RoleRowActions role={role} />,
  },
]
