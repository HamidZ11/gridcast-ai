"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Suspense, use } from "react"
import type { ComponentType } from "react"
import { ArrowLeft, PanelLeftClose, PanelLeftOpen } from "lucide-react"

import { aboutNavigationItem, navigationSections } from "@/lib/navigation"
import type { SystemStatus } from "@/lib/system-status"
import { cn } from "@/lib/utils"

type SidebarProps = {
  collapsed: boolean
  mobileOpen: boolean
  status: Promise<SystemStatus>
  onCloseMobile: () => void
  onToggleCollapsed: () => void
}

export function Sidebar({
  collapsed,
  mobileOpen,
  status,
  onCloseMobile,
  onToggleCollapsed,
}: SidebarProps) {
  const pathname = usePathname()

  return (
    <>
      <button
        type="button"
        aria-label="Close navigation"
        tabIndex={mobileOpen ? 0 : -1}
        className={cn(
          "fixed inset-0 z-40 bg-[var(--gc-ink)]/25 opacity-0 transition-opacity duration-200 xl:hidden",
          mobileOpen ? "pointer-events-auto opacity-100" : "pointer-events-none"
        )}
        onClick={onCloseMobile}
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex shrink-0 flex-col border-r border-[var(--gc-rule)] bg-[var(--gc-surface)] transition-[width,transform] duration-200 ease-out xl:sticky xl:top-0 xl:z-auto xl:h-screen xl:translate-x-0",
          collapsed ? "w-[60px]" : "w-[208px]",
          mobileOpen ? "translate-x-0 shadow-[8px_0_32px_rgba(20,22,26,0.14)]" : "-translate-x-full xl:translate-x-0"
        )}
      >
        {/*
          The collapsed and expanded states render the SAME element tree and
          differ only in classes. The preference is read from localStorage on
          the client, so a structural branch here would mismatch the server
          render and force React to throw the tree away on hydration.
        */}
        <div
          className={cn(
            "flex h-12 shrink-0 items-center border-b border-[var(--gc-rule)]",
            collapsed ? "justify-center px-2" : "gap-2 px-3"
          )}
        >
          <span aria-hidden className="h-2 w-2 shrink-0 rounded-full bg-[var(--gc-model)]" />
          <span
            className={cn(
              "min-w-0 flex-1 truncate text-[13px] font-medium tracking-[-0.01em] text-[var(--gc-ink)]",
              collapsed && "sr-only"
            )}
          >
            GridCast AI
          </span>
          <button
            type="button"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!collapsed}
            onClick={onToggleCollapsed}
            className={cn(
              "size-6 shrink-0 cursor-pointer place-items-center rounded-[4px] text-[var(--gc-ink-3)] transition-colors hover:bg-[var(--gc-surface-sunk)] hover:text-[var(--gc-ink)] xl:grid",
              collapsed ? "hidden xl:grid" : "hidden xl:grid"
            )}
          >
            <PanelLeftClose className={cn("size-4", collapsed && "hidden")} />
            <PanelLeftOpen className={cn("size-4", !collapsed && "hidden")} />
          </button>
        </div>

        <nav aria-label="Sections" className="min-h-0 flex-1 overflow-y-auto px-2 py-3">
          {navigationSections.map((section, sectionIndex) => (
            <div key={section.label} className={sectionIndex > 0 ? "mt-5" : undefined}>
              <p
                className={cn(
                  "px-2 pb-1.5 font-mono text-[9.5px] uppercase tracking-[0.1em] text-[var(--gc-ink-3)]",
                  collapsed && "sr-only"
                )}
              >
                {section.label}
              </p>
              <ul className="space-y-px">
                {section.items.map((item) => (
                  <li key={item.label}>
                    <SidebarLink
                      active={
                        item.href === "/dashboard"
                          ? pathname === "/dashboard"
                          : pathname.startsWith(item.href)
                      }
                      collapsed={collapsed}
                      href={item.href}
                      icon={item.icon}
                      label={item.label}
                      onNavigate={onCloseMobile}
                    />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="shrink-0 border-t border-[var(--gc-rule)] p-2">
          <SidebarLink
            active={pathname.startsWith(aboutNavigationItem.href)}
            collapsed={collapsed}
            href={aboutNavigationItem.href}
            icon={aboutNavigationItem.icon}
            label={aboutNavigationItem.label}
            onNavigate={onCloseMobile}
          />
          <Link
            href="/"
            onClick={onCloseMobile}
            title={collapsed ? "Back to overview page" : undefined}
            className={cn(
              "mt-px flex h-8 items-center rounded-[5px] text-[12.5px] text-[var(--gc-ink-3)] transition-colors hover:bg-[var(--gc-surface-sunk)] hover:text-[var(--gc-ink)]",
              collapsed ? "justify-center px-0" : "gap-2.5 px-2"
            )}
          >
            <ArrowLeft className="size-4 shrink-0" />
            <span className={cn(collapsed && "sr-only")}>Overview page</span>
          </Link>

          <DataSource status={status} collapsed={collapsed} />
        </div>
      </aside>
    </>
  )
}

type SidebarLinkProps = {
  active: boolean
  collapsed: boolean
  href: string
  icon: ComponentType<{ className?: string }>
  label: string
  onNavigate: () => void
}

function SidebarLink({ active, collapsed, href, icon: Icon, label, onNavigate }: SidebarLinkProps) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      title={collapsed ? label : undefined}
      onClick={onNavigate}
      className={cn(
        "relative flex h-8 items-center rounded-[5px] text-[12.5px] transition-colors duration-150",
        collapsed ? "justify-center px-0" : "gap-2.5 px-2",
        active
          ? "bg-[var(--gc-surface-sunk)] font-medium text-[var(--gc-ink)]"
          : "text-[var(--gc-ink-2)] hover:bg-[var(--gc-surface-sunk)] hover:text-[var(--gc-ink)]"
      )}
    >
      {/* selection is carried by the indicator + weight, not by colour alone */}
      {active ? (
        <span
          aria-hidden
          className={cn(
            "absolute rounded-full bg-[var(--gc-model)]",
            collapsed ? "left-0 top-1.5 h-5 w-[2px]" : "-left-2 top-1.5 h-5 w-[2px]"
          )}
        />
      ) : null}
      <Icon className="size-4 shrink-0" />
      <span className={cn("truncate", collapsed && "sr-only")}>{label}</span>
    </Link>
  )
}

/**
 * What the app is actually serving. There is no live feed, so this reports the
 * artifact and the backend, and says so plainly when either is missing.
 */
function DataSource({ status, collapsed }: { status: Promise<SystemStatus>; collapsed: boolean }) {
  return (
    <div className={cn("mt-3 border-t border-[var(--gc-rule)] pt-3", collapsed && "sr-only")}>
      <p className="font-mono text-[9.5px] uppercase tracking-[0.1em] text-[var(--gc-ink-3)]">
        Data source
      </p>
      {/* the status is read live and streams in; until then it claims nothing */}
      <Suspense
        fallback={
          <p className="mt-1.5 flex items-center gap-1.5 text-[11.5px] text-[var(--gc-ink-3)]">
            <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--gc-rule-strong)]" />
            Checking data
          </p>
        }
      >
        <DataSourceStatus status={status} />
      </Suspense>
      <p className="mt-1 text-[11px] leading-[1.4] text-[var(--gc-ink-3)]">Historical record · not a live feed</p>
    </div>
  )
}

function DataSourceStatus({ status: pending }: { status: Promise<SystemStatus> }) {
  const status = use(pending)
  const tone =
    status.source === "artifact"
      ? "bg-[var(--gc-ok)]"
      : status.source === "fallback"
        ? "bg-[var(--gc-warn)]"
        : "bg-[var(--gc-bad)]"

  return (
    <>
      <p className="mt-1.5 flex items-center gap-1.5 text-[11.5px] text-[var(--gc-ink)]">
        <span aria-hidden className={cn("h-1.5 w-1.5 shrink-0 rounded-full", tone)} />
        {status.label}
      </p>
      {status.dataset ? (
        <p className="mt-1 text-[11px] leading-[1.4] text-[var(--gc-ink-3)]">{status.dataset}</p>
      ) : null}
    </>
  )
}
