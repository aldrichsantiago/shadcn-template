import { ROLE_PERMISSIONS } from "~/lib/auth/session.server"
import type { Role } from "./types"

/**
 * Stand-in for a `roles` table, seeded from the permission map the mock session
 * uses. Edits here are in-memory and reset on restart; authorization keeps using
 * `ROLE_PERMISSIONS` in `session.server` until a database backs both.
 */
export const ROLES: Role[] = [
  {
    id: "role_owner",
    name: "Owner",
    description: "Full access, including the permission catalog.",
    permissions: [...ROLE_PERMISSIONS.owner],
    createdAt: "2024-01-08T09:00:00.000Z",
  },
  {
    id: "role_admin",
    name: "Admin",
    description: "Runs the workspace but cannot redefine permissions.",
    permissions: [...ROLE_PERMISSIONS.admin],
    createdAt: "2024-01-08T09:05:00.000Z",
  },
  {
    id: "role_member",
    name: "Member",
    description: "Day-to-day access to users and master data.",
    permissions: [...ROLE_PERMISSIONS.member],
    createdAt: "2024-01-08T09:10:00.000Z",
  },
  {
    id: "role_viewer",
    name: "Viewer",
    description: "Read-only access to every section.",
    permissions: [...ROLE_PERMISSIONS.viewer],
    createdAt: "2024-01-08T09:15:00.000Z",
  },
]
