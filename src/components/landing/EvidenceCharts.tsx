import { ERROR_BY_HOUR, PEAK_DAY, RESIDUALS } from "@/data/landing-evidence"

/* Small, quiet, single-series charts. Each one answers one question. */

/** 15 Jan 2024 - the day with the largest observed swing in the dataset. */
export function PeakDayChart() {
  const W = 560
  const H = 232
  const PAD_L = 34
  const PAD_R = 14
  const PAD_T = 30
  const PAD_B = 26
  const values = PEAK_DAY.demand
  const lo = 20
  const hi = 47
  const x = (i: number) => PAD_L + (i / (values.length - 1)) * (W - PAD_L - PAD_R)
  const y = (v: number) => PAD_T + (1 - (v - lo) / (hi - lo)) * (H - PAD_T - PAD_B)

  const path = values.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ")

  const maxI = values.indexOf(Math.max(...values))
  const minI = values.indexOf(Math.min(...values))

  return (
    <figure className="m-0">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="block w-full"
        role="img"
        aria-label={`Observed Great Britain electricity demand on 15 January 2024, half-hourly. Demand fell to ${values[minI]} gigawatts at ${PEAK_DAY.times[minI]} and rose to ${values[maxI]} gigawatts at ${PEAK_DAY.times[maxI]}.`}
      >
        {[25, 35, 45].map((t) => (
          <g key={t}>
            <line x1={PAD_L} x2={W - PAD_R} y1={y(t)} y2={y(t)} stroke="var(--gc-rule)" strokeWidth="1" shapeRendering="crispEdges" />
            <text x={PAD_L - 7} y={y(t)} textAnchor="end" dominantBaseline="middle" className="fill-[var(--gc-ink-3)] font-mono text-[9.5px] tabular-nums">
              {t}
            </text>
          </g>
        ))}
        <path d={path} fill="none" stroke="var(--gc-observed)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

        {/* trough - label sits below the line, where the plot is empty */}
        <circle cx={x(minI)} cy={y(values[minI])} r="4" fill="var(--gc-observed)" stroke="var(--gc-paper)" strokeWidth="2" />
        <text x={x(minI) + 10} y={y(values[minI]) + 16} className="fill-[var(--gc-ink-2)] font-mono text-[10.5px] tabular-nums">
          {values[minI].toFixed(1)} GW · {PEAK_DAY.times[minI]}
        </text>

        {/* peak - label sits above the line */}
        <circle cx={x(maxI)} cy={y(values[maxI])} r="4" fill="var(--gc-observed)" stroke="var(--gc-paper)" strokeWidth="2" />
        <text x={x(maxI)} y={y(values[maxI]) - 12} textAnchor="middle" className="fill-[var(--gc-ink)] font-mono text-[10.5px] tabular-nums">
          {values[maxI].toFixed(1)} GW · {PEAK_DAY.times[maxI]}
        </text>

        {/* the swing itself, as a measured span */}
        <line x1={x(maxI)} x2={x(maxI)} y1={y(values[maxI]) + 8} y2={y(values[minI])} stroke="var(--gc-ink)" strokeWidth="1" strokeDasharray="2 3" opacity="0.35" />
        <line x1={x(minI)} x2={x(maxI)} y1={y(values[minI])} y2={y(values[minI])} stroke="var(--gc-ink)" strokeWidth="1" strokeDasharray="2 3" opacity="0.35" />
        <text x={x(maxI) - 8} y={(y(values[maxI]) + y(values[minI])) / 2} textAnchor="end" dominantBaseline="middle" className="fill-[var(--gc-ink)] font-mono text-[10.5px] tabular-nums">
          21.8 GW swing
        </text>

        {["00:00", "06:00", "12:00", "18:00"].map((label) => {
          const i = PEAK_DAY.times.indexOf(label)
          return (
            <text key={label} x={x(i)} y={H - 6} className="fill-[var(--gc-ink-3)] font-mono text-[9.5px] tabular-nums">
              {label}
            </text>
          )
        })}
      </svg>
    </figure>
  )
}

/** Mean absolute percentage error by hour of day, held-out split. */
export function ErrorByHourChart() {
  const W = 400
  const H = 160
  const PAD_L = 26
  const PAD_R = 8
  const PAD_T = 26
  const PAD_B = 20
  const band = (W - PAD_L - PAD_R) / 24
  const barW = Math.min(band - 2, 24)
  const max = 3.2
  const y = (v: number) => PAD_T + (1 - v / max) * (H - PAD_T - PAD_B)
  const worst = ERROR_BY_HOUR.reduce((a, b) => (b.e > a.e ? b : a))
  const best = ERROR_BY_HOUR.reduce((a, b) => (b.e < a.e ? b : a))

  return (
    <figure className="m-0">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="block w-full"
        role="img"
        aria-label={`Mean absolute percentage error by hour of day on the held-out split. Worst at ${worst.h}:00 with ${worst.e.toFixed(2)} percent, best at ${best.h}:00 with ${best.e.toFixed(2)} percent.`}
      >
        {[1, 2, 3].map((t) => (
          <g key={t}>
            <line x1={PAD_L} x2={W - PAD_R} y1={y(t)} y2={y(t)} stroke="var(--gc-rule)" strokeWidth="1" shapeRendering="crispEdges" />
            <text x={PAD_L - 6} y={y(t)} textAnchor="end" dominantBaseline="middle" className="fill-[var(--gc-ink-3)] font-mono text-[9px] tabular-nums">
              {t}%
            </text>
          </g>
        ))}
        {ERROR_BY_HOUR.map((d) => {
          const bx = PAD_L + d.h * band + (band - barW) / 2
          const by = y(d.e)
          const bh = H - PAD_B - by
          return <rect key={d.h} x={bx} y={by} width={barW} height={bh} rx="2" fill="var(--gc-model)" opacity={d.h === worst.h || d.h === best.h ? 1 : 0.42} />
        })}
        <line x1={PAD_L} x2={W - PAD_R} y1={H - PAD_B} y2={H - PAD_B} stroke="var(--gc-rule-strong)" strokeWidth="1" shapeRendering="crispEdges" />
        <text x={PAD_L + worst.h * band + barW / 2} y={y(worst.e) - 5} textAnchor="middle" className="fill-[var(--gc-ink)] font-mono text-[9.5px] tabular-nums">
          {worst.e.toFixed(2)}
        </text>
        <text x={PAD_L + best.h * band + barW / 2} y={y(best.e) - 5} textAnchor="middle" className="fill-[var(--gc-ink)] font-mono text-[9.5px] tabular-nums">
          {best.e.toFixed(2)}
        </text>
        {[0, 6, 12, 18, 23].map((h) => (
          <text key={h} x={PAD_L + h * band + barW / 2} y={H - 6} textAnchor="middle" className="fill-[var(--gc-ink-3)] font-mono text-[9px] tabular-nums">
            {String(h).padStart(2, "0")}
          </text>
        ))}
      </svg>
    </figure>
  )
}

/** Distribution of (predicted − observed) across all 3,447 held-out half-hours. */
export function ResidualChart() {
  const W = 400
  const H = 160
  const PAD_L = 26
  const PAD_R = 8
  const PAD_T = 26
  const PAD_B = 20
  const band = (W - PAD_L - PAD_R) / RESIDUALS.length
  const barW = Math.min(band - 2, 24)
  const max = Math.max(...RESIDUALS.map((d) => d.n)) * 1.12
  const y = (v: number) => PAD_T + (1 - v / max) * (H - PAD_T - PAD_B)
  const zeroBand = RESIDUALS.findIndex((d) => d.c > 0)

  return (
    <figure className="m-0">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="block w-full"
        role="img"
        aria-label="Distribution of prediction error across all 3,447 held-out half-hours, in 150 megawatt bins, centred close to zero with no systematic bias."
      >
        {RESIDUALS.map((d) => {
          const bx = PAD_L + RESIDUALS.indexOf(d) * band + (band - barW) / 2
          const by = y(d.n)
          return <rect key={d.c} x={bx} y={by} width={barW} height={H - PAD_B - by} rx="2" fill="var(--gc-model)" opacity={Math.abs(d.c) <= 300 ? 1 : 0.42} />
        })}
        <line x1={PAD_L} x2={W - PAD_R} y1={H - PAD_B} y2={H - PAD_B} stroke="var(--gc-rule-strong)" strokeWidth="1" shapeRendering="crispEdges" />
        <line
          x1={PAD_L + zeroBand * band}
          x2={PAD_L + zeroBand * band}
          y1={PAD_T - 4}
          y2={H - PAD_B + 4}
          stroke="var(--gc-ink)"
          strokeWidth="1"
          opacity="0.35"
          shapeRendering="crispEdges"
        />
        <text x={PAD_L + zeroBand * band} y={PAD_T - 9} textAnchor="middle" className="fill-[var(--gc-ink-2)] font-mono text-[9.5px]">
          0 MW
        </text>
        <text x={PAD_L + 2} y={H - 6} className="fill-[var(--gc-ink-3)] font-mono text-[9px] tabular-nums">
          −1,500 MW
        </text>
        <text x={W - PAD_R - 2} y={H - 6} textAnchor="end" className="fill-[var(--gc-ink-3)] font-mono text-[9px] tabular-nums">
          +1,500 MW
        </text>
      </svg>
    </figure>
  )
}
