import { useState } from "react"
import { DataTable } from "~/components/data-table/data-table"
import { parseListParams } from "~/lib/datatable/params"
import { requirePermission } from "~/lib/auth/session.server"
import { useCan } from "~/lib/auth/use-current-user"
import {
  UserBulkActions,
  UserCreateDialog,
  type UserActionData,
} from "~/modules/users/actions"
import { userColumns } from "~/modules/users/columns"
import {
  USER_DATATABLE_FILTERS,
  USER_DATE_FILTERS,
  USER_QUERY_SCHEMA,
} from "~/modules/users/query"
import { userRepository } from "~/modules/users/repository.server"
import {
  USER_ROLES,
  USER_STATUSES,
  USER_TEAMS,
  type UserRole,
  type UserStatus,
  type UserTeam,
} from "~/modules/users/types"
import type { Route } from "./+types/users"

// Widened so `.includes()` accepts an untrusted string from the form.
const ROLES: readonly string[] = USER_ROLES
const STATUSES: readonly string[] = USER_STATUSES
const TEAMS: readonly string[] = USER_TEAMS

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/

export const meta: Route.MetaFunction = () => [{ title: "Users" }]

export const handle = { breadcrumb: "Users" }

export async function action({
  request,
}: Route.ActionArgs): Promise<UserActionData> {
  const formData = await request.formData()
  const intent = formData.get("intent")

  if (intent === "delete") {
    requirePermission(request, "user:delete")
    const ids = formData.getAll("ids").map(String).filter(Boolean)
    if (ids.length === 0) return { errors: { form: "No rows selected." } }

    // Unknown ids are ignored, so a stale selection can't fail the request.
    return { deleted: await userRepository.deleteUsers(ids) }
  }

  if (intent === "create") {
    requirePermission(request, "user:add")
    const name = String(formData.get("name") ?? "").trim()
    const email = String(formData.get("email") ?? "").trim()
    const role = String(formData.get("role") ?? "")
    const status = String(formData.get("status") ?? "")
    const team = String(formData.get("team") ?? "")

    const errors: Record<string, string> = {}
    if (!name) errors.name = "Name is required."
    if (!EMAIL_PATTERN.test(email))
      errors.email = "Enter a valid email address."
    if (!ROLES.includes(role)) errors.role = "Unknown role."
    if (!STATUSES.includes(status)) errors.status = "Unknown status."
    if (!TEAMS.includes(team)) errors.team = "Unknown team."
    if (Object.keys(errors).length > 0) return { errors }

    await userRepository.createUser({
      name,
      email,
      // Validated against their whitelists above.
      role: role as UserRole,
      status: status as UserStatus,
      team: team as UserTeam,
    })

    return { created: true }
  }

  if (intent === "update") {
    requirePermission(request, "user:edit")
    const id = String(formData.get("id") ?? "")
    const name = String(formData.get("name") ?? "").trim()
    const email = String(formData.get("email") ?? "").trim()
    const role = String(formData.get("role") ?? "")
    const status = String(formData.get("status") ?? "")

    // Trust boundary: never let form values reach the store unvalidated.
    const errors: Record<string, string> = {}
    if (!name) errors.name = "Name is required."
    if (!EMAIL_PATTERN.test(email))
      errors.email = "Enter a valid email address."
    if (!ROLES.includes(role)) errors.role = "Unknown role."
    if (!STATUSES.includes(status)) errors.status = "Unknown status."
    if (Object.keys(errors).length > 0) return { errors }

    const updated = await userRepository.updateUser(id, {
      name,
      email,
      // Both validated against their whitelists above.
      role: role as UserRole,
      status: status as UserStatus,
    })
    if (!updated) return { errors: { form: "That user no longer exists." } }

    return { ok: true }
  }

  return { errors: { form: "Unsupported action." } }
}

export async function loader({ request }: Route.LoaderArgs) {
  requirePermission(request, "user:view")

  const url = new URL(request.url)
  const params = parseListParams(url.searchParams, USER_QUERY_SCHEMA)
  return userRepository.list(params)
}

export default function Users({ loaderData }: Route.ComponentProps) {
  const [creating, setCreating] = useState(false)
  const canDelete = useCan("user:delete")

  return (
    <div className="mx-auto flex w-full flex-1 flex-col gap-6 p-6">
      <DataTable
        columns={userColumns}
        initialResult={loaderData}
        schema={USER_QUERY_SCHEMA}
        getRowId={(user) => user.id}
        enableRowSelection={canDelete}
        getRowLabel={(user) => user.name}
        addAction={{
          label: "Add user",
          permission: "user:add",
          onClick: () => setCreating(true),
        }}
        selectionActions={(selection) => (
          <UserBulkActions selection={selection} />
        )}
        filters={USER_DATATABLE_FILTERS}
        dateFilters={USER_DATE_FILTERS}
        searchPlaceholder="Search name or email…"
        itemLabel="users"
        emptyMessage="No users match the current filters."
      />

      <UserCreateDialog open={creating} onOpenChange={setCreating} />
    </div>
  )
}
