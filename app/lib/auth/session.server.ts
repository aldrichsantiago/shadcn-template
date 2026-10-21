import { ALL_PERMISSIONS, can, type Permission } from "./permissions"
import {
  isCurrentUserRole,
  type CurrentUser,
  type CurrentUserRole,
} from "./roles"

const VIEW_PERMISSIONS = ALL_PERMISSIONS.filter((permission) =>
  permission.endsWith(":view")
)

/**
 * Role -> permissions. Placeholder until roles are stored in the database: the
 * roles page already edits role rows, so wiring this map to that table later is
 * a repository change, not a UI change.
 */
export const ROLE_PERMISSIONS: Record<CurrentUserRole, readonly Permission[]> =
  {
    owner: ALL_PERMISSIONS,
    // Admins run the workspace but cannot redefine the permission catalog itself.
    admin: ALL_PERMISSIONS.filter(
      (permission) =>
        permission !== "permission:add" &&
        permission !== "permission:edit" &&
        permission !== "permission:delete"
    ),
    member: [
      ...VIEW_PERMISSIONS,
      "user:add",
      "user:edit",
      "master-data:add",
      "master-data:edit",
    ],
    viewer: VIEW_PERMISSIONS,
  }

/** Dev-only stand-in for a real session. Replaced by auth when it lands. */
let profile = {
  id: "usr_0001",
  name: "Aisha Okafor",
  email: "aisha@acme.test",
}

const ROLE_COOKIE = "mock_role"

function defaultRole(): CurrentUserRole {
  const fromEnv = process.env.MOCK_USER_ROLE
  return fromEnv && isCurrentUserRole(fromEnv) ? fromEnv : "owner"
}

function readRoleCookie(request: Request): CurrentUserRole | null {
  const header = request.headers.get("Cookie")
  if (!header) return null

  for (const part of header.split(";")) {
    const [name, ...rest] = part.trim().split("=")
    if (name !== ROLE_COOKIE) continue
    const value = decodeURIComponent(rest.join("="))
    return isCurrentUserRole(value) ? value : null
  }

  return null
}

export function getCurrentUser(request: Request): CurrentUser {
  const role = readRoleCookie(request) ?? defaultRole()
  return { ...profile, role, permissions: ROLE_PERMISSIONS[role] }
}

/**
 * Throws 403 instead of silently no-oping: the UI hides what the user cannot do,
 * so a request that gets here is either a stale tab or a forged one.
 */
export function requirePermission(
  request: Request,
  permission: Permission
): CurrentUser {
  const user = getCurrentUser(request)
  if (!can(user.permissions, permission)) {
    throw new Response("Forbidden", {
      status: 403,
      statusText: "Forbidden",
    })
  }
  return user
}

export function updateProfile(patch: { name: string; email: string }): void {
  profile = { ...profile, ...patch }
}

/** `Set-Cookie` value for the dev role switcher on the settings page. */
export function roleCookie(role: CurrentUserRole): string {
  return `${ROLE_COOKIE}=${encodeURIComponent(role)}; Path=/; SameSite=Lax; HttpOnly`
}
