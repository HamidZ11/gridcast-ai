"use client"

import { useState, useSyncExternalStore } from "react"
import type { ReactNode } from "react"

import { Sidebar } from "@/components/layout/Sidebar"
import { Topbar } from "@/components/layout/Topbar"

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

export function AppShell({ children }: Readonly<{ children: ReactNode }>) {
  const collapsed = useSyncExternalStore(
    subscribeSidebarPreference,
    getSidebarSnapshot,
    getServerSidebarSnapshot
  )
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#F6F8FB] text-[#0F172A]">
      <div className="flex min-h-screen">
        <Sidebar
          collapsed={collapsed}
          mobileOpen={mobileOpen}
          onCloseMobile={() => setMobileOpen(false)}
          onToggleCollapsed={() => setSidebarPreference(!collapsed)}
        />
        <div className="flex min-w-0 flex-1 flex-col transition-[width,margin] duration-[320ms] ease-[cubic-bezier(0.22,1,0.36,1)]">
          <Topbar onOpenSidebar={() => setMobileOpen(true)} />
          {children}
        </div>
      </div>
    </div>
  )
}
