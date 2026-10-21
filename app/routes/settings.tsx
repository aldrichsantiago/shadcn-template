import { useEffect } from "react"
import { Link, data, useFetcher, useRevalidator } from "react-router"
import { Loader2Icon } from "lucide-react"
import { toast } from "sonner"
import { Button } from "~/components/ui/button"
import { Field, FieldError, FieldGroup } from "~/components/ui/field"
import { Label } from "~/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select"
import { CURRENT_USER_ROLES, isCurrentUserRole } from "~/lib/auth/roles"
import { roleCookie } from "~/lib/auth/session.server"
import { useCurrentUser } from "~/lib/auth/use-current-user"
import type { Permission } from "~/lib/auth/permissions"
import type { Route } from "./+types/settings"

type SettingsActionData = {
  ok?: boolean
  role?: string
  errors?: Record<string, string>
}

export const meta: Route.MetaFunction = () => [{ title: "Settings" }]

export const handle = { breadcrumb: "Settings" }

/**
 * Dev-only role switcher: lets you verify permission gating without an auth
 * system. Returns 404 outside development, so it never ships as a real feature.
 */
export async function action({ request }: Route.ActionArgs) {
  if (!import.meta.env.DEV) {
    throw new Response("Not found", { status: 404, statusText: "Not Found" })
  }

  const formData = await request.formData()
  const role = String(formData.get("role") ?? "")
  if (!isCurrentUserRole(role)) {
    return { errors: { form: "Unknown role." } } satisfies SettingsActionData
  }

  return data<SettingsActionData>(
    { ok: true, role },
    { headers: { "Set-Cookie": roleCookie(role) } }
  )
}

const SECTIONS: readonly {
  title: string
  href: string
  permission: Permission
}[] = [
  { title: "Users", href: "/users", permission: "user:view" },
  { title: "Roles", href: "/roles", permission: "role:view" },
  { title: "Permissions", href: "/permissions", permission: "permission:view" },
  {
    title: "Master Data",
    href: "/master-data",
    permission: "master-data:view",
  },
]

export default function Settings() {
  const user = useCurrentUser()
  const fetcher = useFetcher<SettingsActionData>()
  const revalidator = useRevalidator()
  const result = fetcher.data
  const pending = fetcher.state !== "idle"

  // Only react to a new response; `revalidator` is intentionally not a dep, and
  // revalidating refreshes the root loader so the sidebar/permissions update.
  useEffect(() => {
    if (!result) return
    if (result.ok) {
      revalidator.revalidate()
      toast.success(`Now viewing as ${result.role}`)
    } else if (result.errors?.form) {
      toast.error(result.errors.form)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result])

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-6">
      <section className="rounded-xl border bg-card p-6">
        <h2 className="text-sm font-semibold">Administration</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Sections you can open with your current permissions.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {SECTIONS.filter((section) =>
            user.permissions.includes(section.permission)
          ).map((section) => (
            <Button key={section.href} asChild variant="outline" size="sm">
              <Link to={section.href}>{section.title}</Link>
            </Button>
          ))}
        </div>
      </section>

      {import.meta.env.DEV && (
        <section className="rounded-xl border bg-card p-6">
          <h2 className="text-sm font-semibold">Developer: simulate role</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Switches the mock session role to check permission gating. Stores a
            cookie; sign-out is clearing it.
          </p>

          <fetcher.Form method="post" className="mt-4 max-w-xs">
            <FieldGroup>
              <Field>
                <Label htmlFor="settings-role">Role</Label>
                <Select name="role" defaultValue={user.role}>
                  <SelectTrigger
                    id="settings-role"
                    className="w-full capitalize"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENT_USER_ROLES.map((role) => (
                      <SelectItem
                        key={role}
                        value={role}
                        className="capitalize"
                      >
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError>{result?.errors?.form}</FieldError>
              </Field>
            </FieldGroup>

            <Button type="submit" className="mt-3" disabled={pending}>
              {pending && <Loader2Icon className="size-4 animate-spin" />}
              {pending ? "Applying…" : "Apply role"}
            </Button>
          </fetcher.Form>
        </section>
      )}
    </div>
  )
}
