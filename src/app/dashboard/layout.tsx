import type { ReactNode } from "react"

import { AppShell } from "@/components/layout/AppShell"
import { getSystemStatus } from "@/lib/system-status"

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  // Read once for the whole shell so every screen reports the same provenance.
  const status = await getSystemStatus()

  return <AppShell status={status}>{children}</AppShell>
}
