"use client"

import { Suspense, use } from "react"
import { Menu } from "lucide-react"

import { AppSearch } from "@/components/layout/AppSearch"
import { useDataSourceStatus } from "@/components/layout/useDataSourceStatus"
import type { SystemStatus } from "@/lib/system-status"
import { cn } from "@/lib/utils"

type TopbarProps = {
  status: Promise<SystemStatus>
  onOpenSidebar?: () => void
}

const STATUS_CLASS =
  "flex shrink-0 items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.07em] text-[var(--gc-ink-2)]"

export function Topbar({ status, onOpenSidebar }: TopbarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-12 shrink-0 items-center justify-between gap-3 border-b border-[var(--gc-rule)] bg-[var(--gc-paper)]/95 px-3 backdrop-blur-[6px] md:px-5">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <button
          type="button"
          aria-label="Open navigation"
          className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-[5px] border border-[var(--gc-rule)] text-[var(--gc-ink-2)] transition-colors hover:bg-[var(--gc-surface-sunk)] hover:text-[var(--gc-ink)] xl:hidden"
          onClick={onOpenSidebar}
        >
          <Menu className="size-4" />
        </button>
        <AppSearch />
      </div>

      {/*
        The product reads a frozen dataset and a saved artifact. This reports
        that, and never claims a live connection. The status is read live and
        streams in; until then it claims nothing.
      */}
      <Suspense
        fallback={
          <p className={STATUS_CLASS}>
            <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--gc-rule-strong)]" />
            <span className="hidden sm:inline">Checking data</span>
            <span className="sm:hidden">Checking</span>
          </p>
        }
      >
        <TopbarStatus status={status} />
      </Suspense>
    </header>
  )
}

const SHORT_LABEL: Record<SystemStatus["source"], string> = {
  artifact: "Artifact",
  fallback: "Fallback",
  waking: "Waking",
  unavailable: "No data",
}

function TopbarStatus({ status: pending }: { status: Promise<SystemStatus> }) {
  const status = useDataSourceStatus(use(pending))
  const tone =
    status.source === "artifact"
      ? "bg-[var(--gc-ok)]"
      : status.source === "fallback"
        ? "bg-[var(--gc-warn)]"
        : status.source === "waking"
          ? "bg-[var(--gc-rule-strong)]"
          : "bg-[var(--gc-bad)]"

  return (
    <p title={status.detail} className={STATUS_CLASS}>
      <span aria-hidden className={cn("h-1.5 w-1.5 shrink-0 rounded-full", tone)} />
      <span className="hidden sm:inline">{status.label}</span>
      <span className="sm:hidden">{SHORT_LABEL[status.source]}</span>
    </p>
  )
}
