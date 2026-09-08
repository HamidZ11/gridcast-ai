"use client"

import { useState, useSyncExternalStore } from "react"
import type { ReactNode } from "react"

import { Sidebar } from "@/components/layout/Sidebar"
import { Topbar } from "@/components/layout/Topbar"
import type { SystemStatus } from "@/lib/system-status"

const STORAGE_KEY = "gridcast-sidebar-collapsed"
const STORAGE_EVENT = "gridcast-sidebar-collapsed-change"

function getSidebarSnapshot() {
  if (typeof window === "undefined") {
    return false
  }

  return window.localStorage.getItem(STORAGE_KEY) === "true"
}

function getServerSidebarSnapshot() {
  return false
}

function subscribeSidebarPreference(callback: () => void) {
  window.addEventListener("storage", callback)
  window.addEventListener(STORAGE_EVENT, callback)

  return () => {
    window.removeEventListener("storage", callback)
    window.removeEventListener(STORAGE_EVENT, callback)
  }
}

function setSidebarPreference(collapsed: boolean) {
  window.localStorage.setItem(STORAGE_KEY, String(collapsed))
  window.dispatchEvent(new Event(STORAGE_EVENT))
}

export function AppShell({
  children,
  status,
}: Readonly<{ children: ReactNode; status: SystemStatus }>) {
  const collapsed = useSyncExternalStore(
    subscribeSidebarPreference,
    getSidebarSnapshot,
    getServerSidebarSnapshot
  )
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[var(--gc-paper)] text-[var(--gc-ink)]">
      <div className="flex min-h-screen">
        <Sidebar
          collapsed={collapsed}
          mobileOpen={mobileOpen}
          status={status}
          onCloseMobile={() => setMobileOpen(false)}
          onToggleCollapsed={() => setSidebarPreference(!collapsed)}
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar status={status} onOpenSidebar={() => setMobileOpen(true)} />
          {children}
        </div>
      </div>
    </div>
  )
}
