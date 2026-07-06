"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { ComponentType } from "react"
import {
  ArrowLeft,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react"

import { aboutNavigationItem, navigationSections } from "@/lib/navigation"
import { cn } from "@/lib/utils"

type SidebarProps = {
  collapsed: boolean
  mobileOpen: boolean
  onCloseMobile: () => void
  onToggleCollapsed: () => void
}

export function Sidebar({ collapsed, mobileOpen, onCloseMobile, onToggleCollapsed }: SidebarProps) {
  const pathname = usePathname()

  return (
    <>
      <button
        type="button"
        aria-label="Close navigation"
        className={cn(
          "fixed inset-0 z-40 bg-[#0F172A]/20 opacity-0 backdrop-blur-[2px] transition-opacity duration-200 xl:hidden",
          mobileOpen ? "pointer-events-auto opacity-100" : "pointer-events-none"
        )}
        onClick={onCloseMobile}
      />

      <aside
        className={cn(
          "group/sidebar fixed inset-y-0 left-0 z-50 flex shrink-0 flex-col border-r border-[#E8EDF5] bg-white/95 px-3.5 py-4 shadow-[14px_0_46px_rgba(15,23,42,0.07)] backdrop-blur transition-[width,transform,padding] duration-[320ms] ease-[cubic-bezier(0.22,1,0.36,1)] [will-change:width,transform] xl:sticky xl:top-0 xl:z-auto xl:translate-x-0 xl:bg-white/90 xl:shadow-[14px_0_46px_rgba(15,23,42,0.035)]",
          collapsed ? "w-[96px]" : "w-[220px]",
          mobileOpen ? "translate-x-0" : "-translate-x-full xl:translate-x-0"
        )}
      >
        <div className="group/header flex min-h-10 items-center justify-between gap-2 transition-[min-height] duration-[320ms] ease-[cubic-bezier(0.22,1,0.36,1)]">
          <div
            className={cn(
              "relative h-5 min-w-0 overflow-hidden transition-[width] duration-[320ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
              collapsed ? "w-7" : "w-[126px]"
            )}
          >
            <p
              className={cn(
                "absolute inset-0 whitespace-nowrap text-[14px] font-semibold leading-5 tracking-tight text-[#0F172A] transition-[opacity,transform] duration-[240ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
                collapsed ? "-translate-x-1 opacity-0" : "translate-x-0 opacity-100 delay-100"
              )}
            >
              GridCast AI
            </p>
            <p
              aria-label="GridCast AI"
              className={cn(
                "absolute inset-0 text-center text-[13px] font-bold leading-5 tracking-tight text-[#0F172A] transition-[opacity,transform] duration-[240ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
                collapsed ? "translate-x-0 opacity-100 delay-100" : "translate-x-1 opacity-0"
              )}
            >
              GC
            </p>
          </div>

          <button
            type="button"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!collapsed}
            className={cn(
              "hidden size-7 shrink-0 cursor-pointer place-items-center rounded-[8px] border border-transparent bg-transparent text-[#64748B] transition-[border-color,color,background-color] duration-200 ease-out hover:border-[#E8EDF5] hover:bg-[#F8FAFD] hover:text-[#334155] focus-visible:ring-2 focus-visible:ring-[#2563EB]/35 xl:grid"
            )}
            onClick={onToggleCollapsed}
          >
            {collapsed ? <PanelLeftOpen className="size-[17px]" /> : <PanelLeftClose className="size-[17px]" />}
          </button>
        </div>

        <nav
          className={cn(
            "mt-7 transition-[margin] duration-[320ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
            collapsed ? "space-y-4" : "space-y-5"
          )}
        >
          {navigationSections.map((section) => (
            <div key={section.label}>
              <p
                className={cn(
                  "overflow-hidden px-2.5 pb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#94A3B8] transition-[max-height,opacity,transform,padding] duration-[320ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
                  collapsed
                    ? "max-h-0 -translate-x-1 p-0 opacity-0"
                    : "max-h-6 translate-x-0 opacity-100 delay-100"
                )}
              >
                {section.label}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <SidebarLink
                    key={item.label}
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
                ))}
              </div>
            </div>
          ))}
        </nav>

        <LiveFeed collapsed={collapsed} />

        <div className="mt-auto space-y-2 pt-6">
          <SidebarLink
            active={pathname.startsWith(aboutNavigationItem.href)}
            collapsed={collapsed}
            href={aboutNavigationItem.href}
            icon={aboutNavigationItem.icon}
            label={aboutNavigationItem.label}
            onNavigate={onCloseMobile}
          />
          <BackToLanding collapsed={collapsed} onNavigate={onCloseMobile} />
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
      aria-label={collapsed ? label : undefined}
      onClick={onNavigate}
      className={cn(
        "group relative flex h-10 items-center rounded-[14px] text-[13px] transition-[background-color,box-shadow,color,transform,padding] duration-[320ms] ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:ring-2 focus-visible:ring-[#2563EB]/35",
        collapsed ? "justify-center gap-0 px-0" : "gap-2.5 px-2.5",
        active
          ? "bg-[#F3F6FB] font-semibold text-[#0F172A] shadow-[inset_0_0_0_1px_rgba(232,237,245,0.9)]"
          : "font-medium text-[#64748B] hover:bg-[#F6F8FB] hover:text-[#0F172A]",
        !collapsed && !active && "hover:translate-x-0.5"
      )}
    >
      <Icon className={cn("size-4 shrink-0 transition", active ? "text-[#2563EB]" : "group-hover:text-[#0F172A]")} />
      <span
        className={cn(
          "block max-w-[128px] overflow-hidden truncate transition-[max-width,opacity,transform] duration-[320ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
          collapsed
            ? "max-w-0 -translate-x-1 opacity-0"
            : "max-w-[128px] translate-x-0 opacity-100 delay-100"
        )}
      >
        {label}
      </span>
    </Link>
  )
}

function LiveFeed({ collapsed }: { collapsed: boolean }) {
  return (
    <div
      className={cn(
        "origin-top overflow-hidden rounded-[18px] border border-[#E8EDF5] bg-[#F8FAFD] shadow-[0_14px_30px_rgba(15,23,42,0.035)] transition-[opacity,max-height,padding,margin,transform,border-color] duration-[320ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
        collapsed
          ? "mt-0 max-h-0 scale-[0.96] -translate-y-1 border-transparent p-0 opacity-0"
          : "mt-6 max-h-32 scale-100 translate-y-0 px-3 py-2.5 opacity-100 delay-100"
      )}
      aria-hidden={collapsed}
    >
      <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#94A3B8]">Live Feed</p>
      <div className="mt-1.5 flex items-center gap-1.5">
        <span className="size-1.5 shrink-0 rounded-full bg-[#10B981]" />
        <p className="text-[11px] font-semibold text-[#334155]">Connected</p>
      </div>
      <p className="mt-1.5 text-[11px] font-medium text-[#0F172A]">National Grid ESO</p>
      <p className="mt-0.5 text-[10px] font-medium text-[#94A3B8]">Updated 12:05 UTC</p>
    </div>
  )
}

function BackToLanding({ collapsed, onNavigate }: { collapsed: boolean; onNavigate: () => void }) {
  return (
    <Link
      href="/"
      aria-label="Back to landing page"
      title={collapsed ? "Back to landing page" : undefined}
      onClick={onNavigate}
      className={cn(
        "flex h-8 items-center text-[11px] font-medium text-[#94A3B8] transition-colors duration-200 hover:text-[#475569] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/30",
        collapsed ? "justify-center" : "gap-1.5 px-2.5"
      )}
    >
      <ArrowLeft className="size-3.5 shrink-0" />
      <span
        className={cn(
          "overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-[240ms] ease-out",
          collapsed ? "max-w-0 opacity-0" : "max-w-[130px] opacity-100 delay-100"
        )}
      >
        Back to landing page
      </span>
    </Link>
  )
}
