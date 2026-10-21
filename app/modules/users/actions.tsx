import { useEffect, useState } from "react"
import { useFetcher } from "react-router"
import { MoreHorizontalIcon, PencilIcon, Trash2Icon } from "lucide-react"
import type { RowSelection } from "~/components/data-table/use-row-selection"
import { Button } from "~/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu"
import { Field, FieldError, FieldGroup } from "~/components/ui/field"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select"
import { USER_ROLES, USER_STATUSES, type User } from "./types"

/**
 * Contract of the `users` route action. The action annotates its return type with
 * this, so the two can't drift; the reads below are cast for the same reason.
 */
export type UserActionData = {
  ok?: boolean
  deleted?: number
  errors?: Record<string, string>
}

function readActionData(fetcher: ReturnType<typeof useFetcher>) {
  return fetcher.data as UserActionData | undefined
}

/** Row-level Edit / Delete menu. */
export function UserRowActions({ user }: { user: User }) {
  const fetcher = useFetcher()
  const data = readActionData(fetcher)
  const [editing, setEditing] = useState(false)
  const [confirming, setConfirming] = useState(false)

  const remove = () => {
    const formData = new FormData()
    formData.set("intent", "delete")
    formData.append("ids", user.id)
    fetcher.submit(formData, { method: "post" })
    setConfirming(false)
  }
  // ponytail: if this row is part of a multi-selection, its id lingers in the
  // selection until cleared, so the action bar can overcount. Lift selection into
  // a context the row actions can reach if that ever matters.

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Actions for ${user.name}`}
          >
            <MoreHorizontalIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setEditing(true)}>
            <PencilIcon />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => setConfirming(true)}
          >
            <Trash2Icon />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditUserDialog
        user={user}
        open={editing}
        onOpenChange={setEditing}
        errors={editing ? data?.errors : undefined}
      />

      <ConfirmDeleteDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={`Delete ${user.name}?`}
        description="This removes the user from the workspace and cannot be undone."
        pending={fetcher.state !== "idle"}
        onConfirm={remove}
      />
    </>
  )
}

/** Batch action for the datatable action bar. */
export function UserBulkActions({ selection }: { selection: RowSelection }) {
  const fetcher = useFetcher()
  const data = readActionData(fetcher)
  const [confirming, setConfirming] = useState(false)
  const { selectedIds, selectedCount, clear } = selection

  // Drop the selection once the server confirms the rows are gone, otherwise the
  // bar would keep counting deleted users.
  useEffect(() => {
    if (data?.deleted !== undefined) clear()
  }, [data, clear])

  const removeSelected = () => {
    const formData = new FormData()
    formData.set("intent", "delete")
    for (const id of selectedIds) formData.append("ids", id)
    fetcher.submit(formData, { method: "post" })
    setConfirming(false)
  }

  return (
    <>
      <Button
        type="button"
        variant="destructive"
        size="sm"
        onClick={() => setConfirming(true)}
      >
        <Trash2Icon className="size-3.5" />
        Delete
      </Button>

      <ConfirmDeleteDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={`Delete ${selectedCount} users?`}
        description="This removes them from the workspace and cannot be undone."
        pending={fetcher.state !== "idle"}
        onConfirm={removeSelected}
      />
    </>
  )
}

function EditUserDialog({
  user,
  open,
  onOpenChange,
  errors,
}: {
  user: User
  open: boolean
  onOpenChange: (open: boolean) => void
  errors?: Record<string, string>
}) {
  // Its own fetcher: edit errors and pending state stay out of the delete flow.
  const fetcher = useFetcher()
  const data = readActionData(fetcher)

  useEffect(() => {
    if (data?.ok) onOpenChange(false)
  }, [data, onOpenChange])

  const fieldId = (name: string) => `user-${user.id}-${name}`

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit user</DialogTitle>
          <DialogDescription>Changes are saved immediately.</DialogDescription>
        </DialogHeader>

        <fetcher.Form method="post">
          <input type="hidden" name="intent" value="update" />
          <input type="hidden" name="id" value={user.id} />

          <FieldGroup>
            <Field>
              <Label htmlFor={fieldId("name")}>Name</Label>
              <Input
                id={fieldId("name")}
                name="name"
                defaultValue={user.name}
                autoComplete="off"
                aria-invalid={errors?.name ? true : undefined}
              />
              <FieldError>{errors?.name}</FieldError>
            </Field>
            <Field>
              <Label htmlFor={fieldId("email")}>Email</Label>
              <Input
                id={fieldId("email")}
                name="email"
                type="email"
                defaultValue={user.email}
                autoComplete="off"
                aria-invalid={errors?.email ? true : undefined}
              />
              <FieldError>{errors?.email}</FieldError>
            </Field>
            <Field>
              <Label htmlFor={fieldId("role")}>Role</Label>
              {/* `name` makes Radix render its hidden native select for FormData. */}
              <Select name="role" defaultValue={user.role}>
                <SelectTrigger id={fieldId("role")} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {USER_ROLES.map((role) => (
                    <SelectItem key={role} value={role} className="capitalize">
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError>{errors?.role}</FieldError>
            </Field>
            <Field>
              <Label htmlFor={fieldId("status")}>Status</Label>
              <Select name="status" defaultValue={user.status}>
                <SelectTrigger id={fieldId("status")} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {USER_STATUSES.map((status) => (
                    <SelectItem
                      key={status}
                      value={status}
                      className="capitalize"
                    >
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError>{errors?.status}</FieldError>
            </Field>
          </FieldGroup>

          <FieldError>{errors?.form}</FieldError>

          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={fetcher.state !== "idle"}>
              Save changes
            </Button>
          </DialogFooter>
        </fetcher.Form>
      </DialogContent>
    </Dialog>
  )
}

function ConfirmDeleteDialog({
  open,
  onOpenChange,
  title,
  description,
  pending,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  pending: boolean
  onConfirm: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            disabled={pending}
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
