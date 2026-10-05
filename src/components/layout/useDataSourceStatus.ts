"use client"

import { useEffect, useSyncExternalStore } from "react"

import { BACKEND_UNAVAILABLE } from "@/lib/status-states"
import type { SystemStatus } from "@/lib/system-status"

/*
 * The server reports "waking" when the backend has not answered within 8 s,
 * which is what a Render cold start (~45-65 s) looks like. From there the
 * chrome rechecks /api/status every 5 s for up to 90 s and only then calls the
 * backend unavailable. One shared recheck serves the topbar and the sidebar;
 * the page keeps rendering from cache throughout.
 */
const RECHECK_INTERVAL_MS = 5_000
const RECHECK_WINDOW_MS = 90_000

/** The waking status the current recheck started from; a newer one supersedes it. */
let recheckingFrom: SystemStatus | null = null
let rechecked: SystemStatus | null = null
const listeners = new Set<() => void>()

function publish(status: SystemStatus) {
  rechecked = status
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function recheck(from: SystemStatus) {
  if (recheckingFrom === from) return
  recheckingFrom = from
  rechecked = null

  const deadline = Date.now() + RECHECK_WINDOW_MS
  while (recheckingFrom === from && Date.now() < deadline) {
    const started = Date.now()
    try {
      const response = await fetch("/api/status", { cache: "no-store" })
      const status = response.ok ? ((await response.json()) as SystemStatus) : null
      // Still waking or briefly unreachable both mean "keep waiting".
      if (status && (status.source === "artifact" || status.source === "fallback")) {
        if (recheckingFrom === from) publish(status)
        return
      }
    } catch {
      // The status route itself was unreachable; try again on the next tick.
    }
    await wait(Math.max(0, RECHECK_INTERVAL_MS - (Date.now() - started)))
  }

  if (recheckingFrom === from) publish(BACKEND_UNAVAILABLE)
}

/** The server's status, replaced by a rechecked one once a waking backend settles. */
export function useDataSourceStatus(initial: SystemStatus): SystemStatus {
  useEffect(() => {
    if (initial.source === "waking") void recheck(initial)
  }, [initial])

  const latest = useSyncExternalStore(
    subscribe,
    () => (recheckingFrom === initial ? rechecked : null),
    () => null
  )
  return latest ?? initial
}
