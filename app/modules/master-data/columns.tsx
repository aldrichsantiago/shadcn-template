import { Badge } from "~/components/ui/badge"
import type { DataTableColumn } from "~/lib/datatable/types"
import { formatDate } from "~/lib/format"
import { MasterDataRowActions } from "./actions"
import type {
  MasterDataCategory,
  MasterDataEntry,
  MasterDataSortField,
} from "./types"

const CATEGORY_LABELS: Record<MasterDataCategory, string> = {
  team: "Team",
  department: "Department",
  region: "Region",
}

const CATEGORY_VARIANTS: Record<
  MasterDataCategory,
  "default" | "secondary" | "outline"
> = {
  team: "secondary",
  department: "outline",
  region: "default",
}

export const masterDataColumns: DataTableColumn<
  MasterDataEntry,
  MasterDataSortField
>[] = [
  {
    id: "name",
    header: "Entry",
    sortField: "name",
    headerClassName: "w-[35%]",
    cell: (entry) => (
      <div className="min-w-0">
        <div className="truncate font-medium">{entry.name}</div>
        <div className="truncate text-xs text-muted-foreground">
          {entry.code} · {entry.description}
        </div>
      </div>
    ),
  },
  {
    id: "category",
    header: "Category",
    sortField: "category",
    cell: (entry) => (
      <Badge variant={CATEGORY_VARIANTS[entry.category]}>
        {CATEGORY_LABELS[entry.category]}
      </Badge>
    ),
  },
  {
    id: "updatedAt",
    header: "Updated",
    sortField: "updatedAt",
    cell: (entry) => formatDate(entry.updatedAt),
  },
  {
    id: "actions",
    header: "",
    headerClassName: "text-end",
    className: "text-end",
    cell: (entry) => <MasterDataRowActions entry={entry} />,
  },
]
