import type { MasterDataEntry } from "./types"

/**
 * Stand-in for a `master_data` table. Delete this file once a database is wired
 * up — only `repository.server.ts` imports it.
 */
export const MASTER_DATA: MasterDataEntry[] = [
  {
    id: "md_team_platform",
    category: "team",
    name: "Platform",
    code: "PLT",
    description: "Infrastructure and developer tooling.",
    updatedAt: "2025-02-11T10:00:00.000Z",
  },
  {
    id: "md_team_growth",
    category: "team",
    name: "Growth",
    code: "GRW",
    description: "Acquisition and lifecycle marketing.",
    updatedAt: "2025-02-11T10:05:00.000Z",
  },
  {
    id: "md_team_support",
    category: "team",
    name: "Support",
    code: "SUP",
    description: "Customer support and success.",
    updatedAt: "2025-02-11T10:10:00.000Z",
  },
  {
    id: "md_team_finance",
    category: "team",
    name: "Finance",
    code: "FIN",
    description: "Accounting, billing and procurement.",
    updatedAt: "2025-02-11T10:15:00.000Z",
  },
  {
    id: "md_team_design",
    category: "team",
    name: "Design",
    code: "DSN",
    description: "Product and brand design.",
    updatedAt: "2025-02-11T10:20:00.000Z",
  },
  {
    id: "md_dept_engineering",
    category: "department",
    name: "Engineering",
    code: "ENG",
    description: "Product engineering and quality.",
    updatedAt: "2025-03-02T08:30:00.000Z",
  },
  {
    id: "md_dept_sales",
    category: "department",
    name: "Sales",
    code: "SLS",
    description: "New business and account management.",
    updatedAt: "2025-03-02T08:35:00.000Z",
  },
  {
    id: "md_region_emea",
    category: "region",
    name: "EMEA",
    code: "EMEA",
    description: "Europe, Middle East and Africa.",
    updatedAt: "2025-03-14T12:00:00.000Z",
  },
  {
    id: "md_region_apac",
    category: "region",
    name: "APAC",
    code: "APAC",
    description: "Asia Pacific.",
    updatedAt: "2025-03-14T12:05:00.000Z",
  },
  {
    id: "md_region_amer",
    category: "region",
    name: "Americas",
    code: "AMER",
    description: "North and South America.",
    updatedAt: "2025-03-14T12:10:00.000Z",
  },
]
