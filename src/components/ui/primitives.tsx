import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

/*
 * Shared application primitives. See DESIGN.md for the roles these encode.
 * Deliberately small: a page header, a panel, a few label/value shapes, and the
 * two tags that keep provenance visible.
 */

/**
 * Mono, uppercase, tracked - the label register used everywhere.
 *
 * Renders a block-level <span>, not a <p>: this is used inside paragraphs and
 * inline runs, and a nested <p> would be re-parented by the browser and break
 * hydration.
 */
export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "block font-mono text-[10.5px] uppercase leading-4 tracking-[0.08em] text-[var(--gc-ink-3)]",
        className
      )}
    >
      {children}
    </span>
  )
}

/**
 * Page header. The title names the task, not the product - the sidebar already
 * says which product this is.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  meta,
}: {
  eyebrow: string
  title: string
  description?: string
  actions?: ReactNode
  meta?: ReactNode
}) {
  return (
    <header className="border-b border-[var(--gc-rule)] pb-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="min-w-0">
          <Eyebrow>{eyebrow}</Eyebrow>
          <h1 className="mt-1.5 text-[20px] font-medium leading-tight tracking-[-0.015em] text-[var(--gc-ink)]">
            {title}
          </h1>
          {description ? (
            <p className="mt-1.5 max-w-[68ch] text-[12.5px] leading-[1.5] text-[var(--gc-ink-2)]">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? <div className="flex min-w-0 max-w-full shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      {meta ? <div className="mt-3">{meta}</div> : null}
    </header>
  )
}

/** A contained, independently meaningful block. Not a wrapper for every section. */
export function Panel({
  children,
  className,
  as: Tag = "section",
}: {
  children: ReactNode
  className?: string
  as?: "section" | "div" | "article" | "aside"
}) {
  return (
    <Tag
      className={cn(
        // min-w-0 so a locally scrolling table or chart inside cannot widen its grid track
        "min-w-0 rounded-[8px] border border-[var(--gc-rule-strong)] bg-[var(--gc-surface)]",
        className
      )}
    >
      {children}
    </Tag>
  )
}

export function PanelHeader({
  eyebrow,
  title,
  actions,
  note,
  className,
}: {
  eyebrow?: string
  title: string
  actions?: ReactNode
  note?: string
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-start justify-between gap-x-6 gap-y-2 border-b border-[var(--gc-rule)] px-4 py-3",
        className
      )}
    >
      <div className="min-w-0">
        {eyebrow ? <Eyebrow className="mb-1">{eyebrow}</Eyebrow> : null}
        <h2 className="text-[14px] font-medium leading-tight tracking-[-0.01em] text-[var(--gc-ink)]">
          {title}
        </h2>
        {note ? (
          <p className="mt-1 max-w-[74ch] text-[12px] leading-[1.5] text-[var(--gc-ink-3)]">{note}</p>
        ) : null}
      </div>
      {/* not shrink-0: an actions slot can hold a locally scrolling control, and
          pinning its width would push the whole page sideways on narrow screens */}
      {actions ? <div className="flex min-w-0 max-w-full flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  )
}

/**
 * A headline number. Proportional figures, never tabular - see DESIGN.md.
 * `state` drives the whole tile, so an unavailable value cannot read as healthy.
 */
export function Figure({
  label,
  value,
  unit,
  detail,
  state = "value",
  className,
}: {
  label: string
  value: string
  unit?: string
  detail?: ReactNode
  state?: "value" | "unavailable"
  className?: string
}) {
  const unavailable = state === "unavailable"
  return (
    <div className={cn("min-w-0", className)}>
      <Eyebrow>{label}</Eyebrow>
      <p
        className={cn(
          "mt-2 flex items-baseline gap-1.5 leading-none tracking-[-0.02em]",
          unavailable ? "text-[26px] text-[var(--gc-ink-3)]" : "text-[28px] text-[var(--gc-ink)]"
        )}
      >
        {value}
        {unit ? <span className="text-[13px] text-[var(--gc-ink-3)]">{unit}</span> : null}
      </p>
      {detail ? (
        <div className="mt-2 text-[12px] leading-[1.45] text-[var(--gc-ink-3)]">{detail}</div>
      ) : null}
    </div>
  )
}

/**
 * Reserved status. Always paired with its text - colour never carries the
 * meaning on its own, and neither hue is a data-series colour.
 */
export function StatusChip({
  tone,
  children,
  className,
}: {
  tone: "ok" | "warn" | "bad" | "neutral"
  children: ReactNode
  className?: string
}) {
  const dot =
    tone === "ok"
      ? "bg-[var(--gc-ok)]"
      : tone === "warn"
        ? "bg-[var(--gc-warn)]"
        : tone === "bad"
          ? "bg-[var(--gc-bad)]"
          : "bg-[var(--gc-rule-strong)]"
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-[4px] border border-[var(--gc-rule)] bg-[var(--gc-surface)] px-1.5 py-0.5 font-mono text-[10.5px] uppercase tracking-[0.06em] text-[var(--gc-ink-2)]",
        className
      )}
    >
      <span aria-hidden className={cn("h-1.5 w-1.5 shrink-0 rounded-full", dot)} />
      {children}
    </span>
  )
}

/**
 * Marks a value that is not measured: operations placeholders, fixed regional
 * shares, illustrative series. Neutral by design so it never competes with the
 * status system.
 */
export function ProvenanceTag({ children, title }: { children: ReactNode; title?: string }) {
  return (
    <span
      title={title}
      className="inline-flex items-center whitespace-nowrap rounded-[3px] border border-dashed border-[var(--gc-rule-strong)] px-1.5 py-px font-mono text-[9.5px] uppercase tracking-[0.07em] text-[var(--gc-ink-3)]"
    >
      {children}
    </span>
  )
}

/** Rule-separated label/value rows - the app's default for spec-style content. */
export function DefinitionList({
  items,
  className,
  columns = 1,
}: {
  items: { label: string; value: ReactNode; detail?: ReactNode }[]
  className?: string
  columns?: 1 | 2
}) {
  return (
    <dl
      className={cn(
        "border-t border-[var(--gc-rule)]",
        columns === 2 ? "sm:grid sm:grid-cols-2 sm:gap-x-8" : "",
        className
      )}
    >
      {items.map((item) => (
        <div
          key={item.label}
          className="flex items-baseline justify-between gap-4 border-b border-[var(--gc-rule)] py-2.5"
        >
          <dt className="shrink-0 text-[12.5px] text-[var(--gc-ink-3)]">{item.label}</dt>
          <dd className="min-w-0 text-right text-[12.5px] text-[var(--gc-ink)]">
            {item.value}
            {item.detail ? (
              <span className="mt-0.5 block text-[11.5px] text-[var(--gc-ink-3)]">{item.detail}</span>
            ) : null}
          </dd>
        </div>
      ))}
    </dl>
  )
}

/** A short, in-place explanation. Used sparingly, next to what it explains. */
export function Note({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn("text-[11.5px] leading-[1.5] text-[var(--gc-ink-3)]", className)}>{children}</p>
  )
}
