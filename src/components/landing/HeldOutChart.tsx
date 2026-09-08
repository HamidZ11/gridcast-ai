"use client"

import { useCallback, useMemo, useRef, useState } from "react"

import { HERO_WEEK } from "@/data/landing-evidence"

/*
 * Two stacked panels sharing one x axis - never a dual y axis.
 *
 *   top     observed vs predicted national demand, GW
 *   bottom  the same week's residual (predicted - observed), MW, magnified
 *
 * The top panel is the honest picture: at grid scale the two lines sit almost
 * on top of each other. The bottom panel is the only way to actually see the
 * error, so it gets its own panel rather than a second scale on the same plot.
 */

const W = 900
const TOP_H = 236
const GAP = 26
const BOT_H = 96
const PAD_L = 46
const PAD_R = 18
const PAD_T = 10
const AXIS_H = 22
const H = PAD_T + TOP_H + GAP + BOT_H + AXIS_H

const PLOT_W = W - PAD_L - PAD_R
const N = HERO_WEEK.actual.length

const Y_MIN = 15
const Y_MAX = 46
const Y_TICKS = [20, 30, 40]

/* the panel must contain the week's worst error, not clip it */
const RES_MAX = 2500
const RES_TICKS = [-2000, 0, 2000]

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

const x = (i: number) => PAD_L + (i / (N - 1)) * PLOT_W
const yTop = (v: number) => PAD_T + TOP_H - ((v - Y_MIN) / (Y_MAX - Y_MIN)) * TOP_H
const BOT_TOP = PAD_T + TOP_H + GAP
const yBot = (mw: number) => BOT_TOP + BOT_H / 2 - (mw / RES_MAX) * (BOT_H / 2)

function line(values: readonly number[], toY: (v: number) => number) {
  return values.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)} ${toY(v).toFixed(1)}`).join(" ")
}

/** First index whose timestamp lands on 00:00 - the day boundaries. */
const dayBoundaries = HERO_WEEK.timestamps.reduce<number[]>((acc, t, i) => {
  if (t.endsWith("00:00")) acc.push(i)
  return acc
}, [])

const residualsMw = HERO_WEEK.predicted.map((p, i) => (p - HERO_WEEK.actual[i]) * 1000)

export function HeldOutChart() {
  const svgRef = useRef<SVGSVGElement>(null)
  const [cursor, setCursor] = useState<number | null>(null)

  const paths = useMemo(
    () => ({
      actual: line(HERO_WEEK.actual, yTop),
      predicted: line(HERO_WEEK.predicted, yTop),
      residual: line(residualsMw, yBot),
      residualArea: `${line(residualsMw, yBot)} L${x(N - 1).toFixed(1)} ${yBot(0).toFixed(1)} L${x(0).toFixed(1)} ${yBot(0).toFixed(1)} Z`,
    }),
    []
  )

  const locate = useCallback((clientX: number) => {
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const ratio = (clientX - rect.left) / rect.width
    const svgX = ratio * W
    const i = Math.round(((svgX - PAD_L) / PLOT_W) * (N - 1))
    setCursor(Math.min(N - 1, Math.max(0, i)))
  }, [])

  const onKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault()
      const step = event.shiftKey ? 48 : 1
      setCursor((current) => {
        const base = current ?? Math.floor(N / 2)
        return Math.min(N - 1, Math.max(0, base + (event.key === "ArrowLeft" ? -step : step)))
      })
    }
    if (event.key === "Home") setCursor(0)
    if (event.key === "End") setCursor(N - 1)
    if (event.key === "Escape") setCursor(null)
  }, [])

  const active = cursor === null ? null : {
    index: cursor,
    stamp: HERO_WEEK.timestamps[cursor],
    actual: HERO_WEEK.actual[cursor],
    predicted: HERO_WEEK.predicted[cursor],
    residual: residualsMw[cursor],
  }

  return (
    <figure className="m-0 min-w-0">
      <figcaption className="mb-3 flex flex-wrap items-baseline gap-x-4 gap-y-1.5">
        <span className="flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.08em] text-[var(--gc-ink-2)]">
          <svg width="14" height="8" aria-hidden className="shrink-0">
            <line x1="0" y1="4" x2="14" y2="4" stroke="var(--gc-observed)" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
          Observed
        </span>
        <span className="flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.08em] text-[var(--gc-ink-2)]">
          <svg width="14" height="8" aria-hidden className="shrink-0">
            <line x1="0" y1="4" x2="14" y2="4" stroke="var(--gc-model)" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
          Model
        </span>
        <span className="ml-auto font-mono text-[10.5px] tracking-[0.02em] text-[var(--gc-ink-3)]">
          {active ? (
            <>
              <span className="text-[var(--gc-ink-2)]">{active.stamp.slice(5)}</span>
              {"  obs "}
              <span className="text-[var(--gc-ink)]">{active.actual.toFixed(2)}</span>
              {"  mdl "}
              <span className="text-[var(--gc-ink)]">{active.predicted.toFixed(2)}</span>
              {" GW  err "}
              <span className="text-[var(--gc-ink)]">
                {active.residual > 0 ? "+" : ""}
                {active.residual.toFixed(0)}
              </span>
              {" MW"}
            </>
          ) : (
            "Drag across the chart to read values"
          )}
        </span>
      </figcaption>

      {/* Below ~640px the week does not fit at a legible label size, so the plot
          keeps its own horizontal scroll rather than shrinking its type to 4px.
          Same treatment as the scoreboard table and the dashboard screenshots. */}
      <div className="-mx-1 overflow-x-auto overscroll-x-contain px-1 sm:mx-0 sm:overflow-visible sm:px-0">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="block w-[620px] max-w-none cursor-crosshair touch-pan-y outline-none focus-visible:ring-2 focus-visible:ring-[var(--gc-model)]/50 sm:w-full"
        role="img"
        tabIndex={0}
        aria-label={`Observed versus predicted Great Britain electricity demand for ${HERO_WEEK.label}, half-hourly, with the model's error in megawatts beneath. Held-out test week. Mean absolute percentage error ${HERO_WEEK.mape} percent.`}
        onPointerMove={(event) => locate(event.clientX)}
        onPointerLeave={() => setCursor(null)}
        onKeyDown={onKeyDown}
        onBlur={() => setCursor(null)}
      >
        {/* ---- top panel: demand, GW ---- */}
        {Y_TICKS.map((t) => (
          <g key={t}>
            <line
              x1={PAD_L}
              x2={W - PAD_R}
              y1={yTop(t)}
              y2={yTop(t)}
              stroke="var(--gc-rule)"
              strokeWidth="1"
              shapeRendering="crispEdges"
            />
            <text
              x={PAD_L - 8}
              y={yTop(t)}
              textAnchor="end"
              dominantBaseline="middle"
              className="fill-[var(--gc-ink-3)] font-mono text-[10px] tabular-nums"
            >
              {t}
            </text>
          </g>
        ))}
        <text
          x={PAD_L - 8}
          y={PAD_T + 8}
          textAnchor="end"
          className="fill-[var(--gc-ink-3)] font-mono text-[9px] uppercase tracking-[0.08em]"
        >
          GW
        </text>

        {/* day separators */}
        {dayBoundaries.map((i, k) => (
          <g key={i}>
            <line
              x1={x(i)}
              x2={x(i)}
              y1={PAD_T}
              y2={BOT_TOP + BOT_H}
              stroke="var(--gc-rule)"
              strokeWidth="1"
              shapeRendering="crispEdges"
            />
            <text
              x={k === dayBoundaries.length - 1 ? x(i) - 5 : x(i) + 5}
              y={H - 7}
              textAnchor={k === dayBoundaries.length - 1 ? "end" : "start"}
              className="fill-[var(--gc-ink-3)] font-mono text-[10px] uppercase tracking-[0.08em]"
            >
              {DAYS[(k + 1) % 7]}
            </text>
          </g>
        ))}

        <path d={paths.actual} fill="none" stroke="var(--gc-observed)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        <path d={paths.predicted} fill="none" stroke="var(--gc-model)" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" opacity="0.95" />

        {/* ---- bottom panel: residual, MW ---- */}
        {RES_TICKS.map((t) => (
          <g key={t}>
            <line
              x1={PAD_L}
              x2={W - PAD_R}
              y1={yBot(t)}
              y2={yBot(t)}
              stroke={t === 0 ? "var(--gc-rule-strong)" : "var(--gc-rule)"}
              strokeWidth="1"
              shapeRendering="crispEdges"
            />
            <text
              x={PAD_L - 8}
              y={yBot(t)}
              textAnchor="end"
              dominantBaseline="middle"
              className="fill-[var(--gc-ink-3)] font-mono text-[10px] tabular-nums"
            >
              {t > 0 ? `+${t}` : t}
            </text>
          </g>
        ))}
        <text
          x={PAD_L - 8}
          y={BOT_TOP - 6}
          textAnchor="end"
          className="fill-[var(--gc-ink-3)] font-mono text-[9px] uppercase tracking-[0.08em]"
        >
          MW
        </text>
        <path d={paths.residualArea} fill="var(--gc-model)" opacity="0.08" />
        <path d={paths.residual} fill="none" stroke="var(--gc-model)" strokeWidth="1" strokeLinejoin="round" opacity="0.85" />

        {/* ---- crosshair ---- */}
        {active ? (
          <g pointerEvents="none">
            <line
              x1={x(active.index)}
              x2={x(active.index)}
              y1={PAD_T}
              y2={BOT_TOP + BOT_H}
              stroke="var(--gc-ink)"
              strokeWidth="1"
              opacity="0.45"
              shapeRendering="crispEdges"
            />
            <circle cx={x(active.index)} cy={yTop(active.actual)} r="4" fill="var(--gc-observed)" stroke="var(--gc-surface)" strokeWidth="2" />
            <circle cx={x(active.index)} cy={yTop(active.predicted)} r="4" fill="var(--gc-model)" stroke="var(--gc-surface)" strokeWidth="2" />
            <circle cx={x(active.index)} cy={yBot(active.residual)} r="3.5" fill="var(--gc-model)" stroke="var(--gc-surface)" strokeWidth="2" />
          </g>
        ) : null}
      </svg>
      </div>
      <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--gc-ink-3)] sm:hidden">
        Scroll the plot sideways for the full week
      </p>
    </figure>
  )
}
