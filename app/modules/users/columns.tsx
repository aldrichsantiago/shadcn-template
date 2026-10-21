import { Avatar, AvatarFallback } from "~/components/ui/avatar"
import { Badge } from "~/components/ui/badge"
import type { DataTableColumn } from "~/lib/datatable/types"
import { UserRowActions } from "./actions"
import type { User, UserSortField, UserStatus } from "./types"

// Fixed locale + timeZone so the SSR markup and the client render match exactly.
// A relative format ("2 days ago") would desync on hydration by design.
const DATE_FORMATTER = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
})

function formatDate(isoDate: string | null): string {
  return isoDate ? DATE_FORMATTER.format(new Date(isoDate)) : "Never"
}

function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("")
}

const STATUS_VARIANTS: Record<
  UserStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  active: "secondary",
  invited: "outline",
  suspended: "destructive",
}

export const userColumns: DataTableColumn<User, UserSortField>[] = [
  {
    id: "name",
    header: "User",
    sortField: "name",
    cell: (user) => (
      <div className="flex items-center gap-3">
        <Avatar className="size-8">
          <AvatarFallback className="text-xs">
            {initials(user.name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <div className="truncate font-medium">{user.name}</div>
          <div className="truncate text-xs text-muted-foreground">
            {user.email}
          </div>
        </div>
      </div>
    ),
    headerClassName: "w-[26%]",
  },
  {
    id: "role",
    header: "Role",
    sortField: "role",
    cell: (user) => (
      <Badge variant="outline" className="capitalize">
        {user.role}
      </Badge>
    ),
  },
  {
    id: "status",
    header: "Status",
    sortField: "status",
    cell: (user) => (
      <Badge variant={STATUS_VARIANTS[user.status]} className="capitalize">
        {user.status}
      </Badge>
    ),
  },
  {
    id: "team",
    header: "Team",
    sortField: "team",
    cell: (user) => <span className="text-muted-foreground">{user.team}</span>,
  },
  {
    id: "lastActiveAt",
    header: "Last active",
    sortField: "lastActiveAt",
    cell: (user) => (
      <span className={user.lastActiveAt ? undefined : "text-muted-foreground"}>
        {formatDate(user.lastActiveAt)}
      </span>
    ),
  },
  {
    id: "createdAt",
    header: "Created",
    sortField: "createdAt",
    cell: (user) => (
      <span className="text-muted-foreground">
        {formatDate(user.createdAt)}
      </span>
    ),
  },
  {
    id: "actions",
    header: "",
    headerClassName: "w-10",
    className: "text-end",
    cell: (user) => <UserRowActions user={user} />,
  },
]
