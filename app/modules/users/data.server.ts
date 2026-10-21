import { USER_ROLES, USER_STATUSES, USER_TEAMS, type User } from "./types"

/**
 * Stand-in for a real `users` table so the datatable is usable today. Delete this
 * file once a database is wired up — only `repository.server.ts` imports it.
 */

const USER_COUNT = 137
const SEED = 20_240_921

/** Deterministic PRNG: stable data across SSR requests and dev reloads. */
function createRandom(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296
  }
}

const FIRST_NAMES = [
  "Aisha",
  "Bruno",
  "Camila",
  "Devon",
  "Elena",
  "Farid",
  "Grace",
  "Hana",
  "Ivan",
  "Jonas",
  "Kezia",
  "Liam",
  "Maya",
  "Noor",
  "Omar",
  "Priya",
  "Quentin",
  "Rosa",
  "Sami",
  "Tessa",
  "Uma",
  "Viktor",
  "Wren",
  "Xiomara",
  "Yusuf",
  "Zara",
]

const LAST_NAMES = [
  "Okafor",
  "Silva",
  "Nakamura",
  "Kowalski",
  "Haddad",
  "Lindqvist",
  "Mensah",
  "Duarte",
  "Petrov",
  "Rahman",
  "Costa",
  "Novak",
  "Ferreira",
  "Andersen",
  "Ibrahim",
  "Moreau",
  "Chen",
  "Vargas",
  "Bauer",
  "Ali",
]

const DOMAINS = ["acme.io", "globex.com", "initech.dev"]

/** Reference "now" so generated timestamps never depend on the clock. */
const REFERENCE_TIME = Date.UTC(2025, 0, 1)
const DAY_MS = 86_400_000
const MAX_ACCOUNT_AGE_DAYS = 730

function pick<T>(random: () => number, values: readonly T[]): T {
  return values[Math.floor(random() * values.length)]
}

function buildUsers(): User[] {
  const random = createRandom(SEED)
  const usedEmails = new Set<string>()
  const users: User[] = []

  for (let index = 0; index < USER_COUNT; index++) {
    const firstName = pick(random, FIRST_NAMES)
    const lastName = pick(random, LAST_NAMES)

    let email =
      `${firstName}.${lastName}@${pick(random, DOMAINS)}`.toLowerCase()
    if (usedEmails.has(email)) email = email.replace("@", `+${index}@`)
    usedEmails.add(email)

    const createdAt =
      REFERENCE_TIME - Math.floor(random() * MAX_ACCOUNT_AGE_DAYS) * DAY_MS
    // Roughly 8% of users have never signed in, exercising the nullable sort path.
    const lastActiveAt =
      random() < 0.08
        ? null
        : new Date(
            Math.min(
              REFERENCE_TIME,
              createdAt + Math.floor(random() * 90) * DAY_MS
            )
          ).toISOString()

    users.push({
      id: `usr_${String(index + 1).padStart(4, "0")}`,
      name: `${firstName} ${lastName}`,
      email,
      role: pick(random, USER_ROLES),
      status: pick(random, USER_STATUSES),
      team: pick(random, USER_TEAMS),
      lastActiveAt,
      createdAt: new Date(createdAt).toISOString(),
    })
  }

  return users
}

/**
 * The mutable mock store. Mutations are per-process and reset when the server
 * restarts — enough for a mock, gone the moment a real database is wired up.
 */
export const USERS: User[] = buildUsers()
