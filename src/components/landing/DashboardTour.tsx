"use client"

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"

/*
 * A list/detail pair: the five dashboard views on the left, one screenshot on
 * the right. Selection is explicit (click or keyboard), and hover previews it
 * without committing - so nothing important is hidden behind hover alone.
 * On narrow screens the list collapses to a scrollable tab strip above the
 * image, keeping the same read: pick a view, see the view.
 */

type View = {
  id: string
  name: string
  href: string
  summary: string
  /** What the reader is actually looking at in the screenshot. */
  caption: string
  image: string
}

const VIEWS: View[] = [
  {
    id: "overview",
    name: "Overview",
    href: "/dashboard",
    summary: "Peak, latest observation, held-out accuracy, and the 48-hour curve.",
    caption:
      "Overview. Headline figures come from the saved model artifact and the NESO 2024 dataset; the temperature tile reads “Unavailable” because weather is not a model input.",
    image: "/project_screenshots/Overview.png",
  },
  {
    id: "forecast",
    name: "Forecast Analytics",
    href: "/dashboard/forecast",
    summary: "Signal decomposition, demand heatmap, and the predicted distribution.",
    caption:
      "Forecast Analytics. Decomposes the forecast into its components and shows the spread implied by the model's validation error.",
    image: "/project_screenshots/Forecast.png",
  },
  {
    id: "insights",
    name: "Model Insights",
    href: "/dashboard/model-insights",
    summary: "Artifact metadata, the evaluation leaderboard, SHAP contributions.",
    caption:
      "Model Insights. Reads the saved artifact directly — model name, training timestamp, feature count, and the five limitations the metadata documents.",
    image: "/project_screenshots/ModelInsights.png",
  },
  {
    id: "map",
    name: "Grid Map",
    href: "/dashboard/grid-map",
    summary: "Regional demand, stress, and renewable layers across Great Britain.",
    caption:
      "Grid Map. Allocates the national forecast across GB regions using fixed regional shares — the model itself is national, not regional.",
    image: "/project_screenshots/Grid_Map.png",
  },
  {
    id: "scenarios",
    name: "Scenarios",
    href: "/dashboard/scenarios",
    summary: "Move a demand or generation assumption, re-run the 48 hours.",
    caption:
      "Scenarios. Applies explicit sensitivity assumptions on top of the model's baseline forecast, then re-runs the 48-hour horizon and compares.",
    image: "/project_screenshots/Scenarios.png",
  },
]

export function DashboardTour() {
  const [selected, setSelected] = useState(0)
  const [hovered, setHovered] = useState<number | null>(null)
  const shown = hovered ?? selected
  const view = VIEWS[shown]

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)] lg:gap-10">
      {/* list */}
      <div
        className="-mx-5 flex min-w-0 snap-x snap-mandatory gap-2 overflow-x-auto px-5 pb-1 lg:mx-0 lg:flex-col lg:gap-0 lg:overflow-visible lg:px-0 lg:pb-0"
        role="tablist"
        aria-label="Dashboard views"
        onMouseLeave={() => setHovered(null)}
      >
        {VIEWS.map((item, index) => {
          const isSelected = index === selected
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={isSelected}
              aria-controls="dashboard-tour-panel"
              onClick={() => setSelected(index)}
              onMouseEnter={() => setHovered(index)}
              onFocus={() => setSelected(index)}
              className={[
                "group shrink-0 snap-start cursor-pointer rounded-[8px] border px-3.5 py-3 text-left transition-colors duration-150",
                "lg:w-full lg:shrink lg:rounded-none lg:border-0 lg:border-t lg:border-[var(--gc-rule)] lg:px-0 lg:py-4",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gc-model)]/50",
                isSelected
                  ? "border-[var(--gc-rule-strong)] bg-[var(--gc-surface)] lg:bg-transparent"
                  : "border-[var(--gc-rule)] bg-transparent hover:border-[var(--gc-rule-strong)]",
              ].join(" ")}
            >
              <span className="flex items-baseline gap-2.5">
                <span
                  aria-hidden
                  className={[
                    "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full transition-colors duration-150",
                    isSelected ? "bg-[var(--gc-model)]" : "bg-[var(--gc-rule-strong)]",
                  ].join(" ")}
                />
                <span className="min-w-0">
                  <span
                    className={[
                      "block whitespace-nowrap text-[14px] font-medium tracking-[-0.01em] lg:whitespace-normal",
                      isSelected ? "text-[var(--gc-ink)]" : "text-[var(--gc-ink-2)]",
                    ].join(" ")}
                  >
                    {item.name}
                  </span>
                  <span className="mt-1 hidden text-[12.5px] leading-[1.45] text-[var(--gc-ink-3)] lg:block">
                    {item.summary}
                  </span>
                </span>
              </span>
            </button>
          )
        })}
        <div className="hidden border-t border-[var(--gc-rule)] lg:block" />
      </div>

      {/* preview */}
      <div id="dashboard-tour-panel" role="tabpanel" aria-live="polite" className="min-w-0">
        <div className="overflow-x-auto overscroll-x-contain rounded-[6px] border border-[var(--gc-rule-strong)] bg-[var(--gc-surface)] lg:overflow-hidden">
          <div className="relative aspect-[3024/1716] w-[760px] max-w-none sm:w-full">
            {VIEWS.map((item, index) => (
              <Image
                key={item.id}
                src={item.image}
                alt={item.caption}
                fill
                sizes="(max-width: 1024px) 100vw, 900px"
                className={[
                  "object-cover object-top transition-opacity duration-200 motion-reduce:transition-none",
                  index === shown ? "opacity-100" : "opacity-0",
                ].join(" ")}
                priority={index === 0}
              />
            ))}
          </div>
        </div>
        <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--gc-ink-3)] sm:hidden">
          Scroll the frame sideways to read it
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
          <p className="max-w-[62ch] text-[12.5px] leading-[1.55] text-[var(--gc-ink-3)]">{view.caption}</p>
          <Link
            href={view.href}
            className="shrink-0 whitespace-nowrap border-b border-[var(--gc-ink)]/25 pb-0.5 font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--gc-ink)] transition-colors hover:border-[var(--gc-model)] hover:text-[var(--gc-model)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gc-model)]/50"
          >
            Open {view.name} →
          </Link>
        </div>
      </div>
    </div>
  )
}
