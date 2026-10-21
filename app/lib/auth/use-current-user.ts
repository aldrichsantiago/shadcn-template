import { useRouteLoaderData } from "react-router"
import type { loader as rootLoader } from "~/root"
import { can, type Permission } from "./permissions"
import type { CurrentUser } from "./roles"

/**
 * The signed-in user comes from the root loader so every route (and the sidebar)
 * sees the same permissions without prop-drilling them through layouts.
 */
export function useCurrentUser(): CurrentUser {
  const data = useRouteLoaderData<typeof rootLoader>("root")
  if (!data) {
    throw new Error("useCurrentUser() must be used inside the root route")
  }
  return data.currentUser
}

export function useCan(permission: Permission): boolean {
  return can(useCurrentUser().permissions, permission)
}
