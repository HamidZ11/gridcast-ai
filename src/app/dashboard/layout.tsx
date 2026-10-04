import { connection } from "next/server"
import type { ReactNode } from "react"

import { AppShell } from "@/components/layout/AppShell"
import { getSystemStatus } from "@/lib/system-status"

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  // The data-source status is read live on every request (lib/api.ts live
  // reads), so this renders at request time rather than being prerendered.
  // It is streamed, not awaited: a sleeping backend delays the status label,
  // not the page, whose figures still come from the Data Cache.
  await connection()

  // Read once for the whole shell so every screen reports the same provenance.
  return <AppShell status={getSystemStatus()}>{children}</AppShell>
}
