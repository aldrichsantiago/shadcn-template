import { useEffect } from "react"
import { useFetcher } from "react-router"
import { Loader2Icon } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "~/components/ui/badge"
import { Button } from "~/components/ui/button"
import { Field, FieldError, FieldGroup } from "~/components/ui/field"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { getCurrentUser, updateProfile } from "~/lib/auth/session.server"
import type { Route } from "./+types/profile"

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/

type ProfileActionData = {
  ok?: boolean
  errors?: Record<string, string>
}

export const meta: Route.MetaFunction = () => [{ title: "Profile" }]

export const handle = { breadcrumb: "Profile" }

export async function action({
  request,
}: Route.ActionArgs): Promise<ProfileActionData> {
  const formData = await request.formData()
  const name = String(formData.get("name") ?? "").trim()
  const email = String(formData.get("email") ?? "").trim()

  const errors: Record<string, string> = {}
  if (!name) errors.name = "Name is required."
  if (!EMAIL_PATTERN.test(email)) errors.email = "Enter a valid email address."
  if (Object.keys(errors).length > 0) return { errors }

  updateProfile({ name, email })
  return { ok: true }
}

export async function loader({ request }: Route.LoaderArgs) {
  return { user: getCurrentUser(request) }
}

export default function Profile({ loaderData }: Route.ComponentProps) {
  const fetcher = useFetcher<ProfileActionData>()
  const data = fetcher.data
  const errors = data?.errors
  const pending = fetcher.state !== "idle"
  const { user } = loaderData

  useEffect(() => {
    if (data?.ok) toast.success("Profile updated")
    else if (data?.errors) toast.error("Check the highlighted fields.")
  }, [data])

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-6">
      <section className="rounded-xl border bg-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold">{user.name}</h1>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
          <Badge variant="secondary" className="capitalize">
            {user.role}
          </Badge>
        </div>

        <fetcher.Form method="post" className="mt-6">
          <FieldGroup>
            <Field>
              <Label htmlFor="profile-name">Name</Label>
              <Input
                id="profile-name"
                name="name"
                defaultValue={user.name}
                autoComplete="name"
                aria-invalid={errors?.name ? true : undefined}
              />
              <FieldError>{errors?.name}</FieldError>
            </Field>
            <Field>
              <Label htmlFor="profile-email">Email</Label>
              <Input
                id="profile-email"
                name="email"
                type="email"
                defaultValue={user.email}
                autoComplete="email"
                aria-invalid={errors?.email ? true : undefined}
              />
              <FieldError>{errors?.email}</FieldError>
            </Field>
          </FieldGroup>

          <div className="mt-4 flex justify-end">
            <Button type="submit" disabled={pending}>
              {pending && <Loader2Icon className="size-4 animate-spin" />}
              {pending ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </fetcher.Form>
      </section>

      <section className="rounded-xl border bg-card p-6">
        <h2 className="text-sm font-semibold">Effective permissions</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Derived from the <span className="font-medium">{user.role}</span> role
          in this environment.
        </p>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {user.permissions.map((permission) => (
            <code
              key={permission}
              className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs"
            >
              {permission}
            </code>
          ))}
        </div>
      </section>
    </div>
  )
}
