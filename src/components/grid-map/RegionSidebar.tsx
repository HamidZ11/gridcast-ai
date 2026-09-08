"use client"

import { Area, AreaChart, ResponsiveContainer, Tooltip } from "recharts"

import {
  DefinitionList,
  Note,
  Panel,
  PanelHeader,
  ProvenanceTag,
  StatusChip,
} from "@/components/ui/primitives"
import { LAYER_PROVENANCE } from "@/components/grid-map/layer-provenance"
import {
  getRegionalLayerPresentation,
  type RegionalDemandData,
  type RegionalLayer,
} from "@/lib/regional-data"

/** danger/warning/success/neutral from the data layer onto the reserved tones. */
function toTone(tone: ReturnType<typeof getRegionalLayerPresentation>["badgeTone"]) {
  if (tone === "danger") return "bad" as const
  if (tone === "warning") return "warn" as const
  if (tone === "success") return "ok" as const
  return "neutral" as const
}

export function RegionSidebar({
  region,
  layer,
}: {
  region: RegionalDemandData
  layer: RegionalLayer
}) {
  const presentation = getRegionalLayerPresentation(region, layer)
  const provenance = LAYER_PROVENANCE[layer]
  const consumers = [
    ["Residential", region.consumers.residential],
    ["Industrial", region.consumers.industrial],
    ["Commercial", region.consumers.commercial],
  ] as const

  return (
    <Panel key={region.id} className="animate-enter self-start" as="aside">
      <PanelHeader
        eyebrow="Selected region"
        title={region.name}
        note={presentation.layerLabel}
        actions={
          <>
            <ProvenanceTag title={provenance.note}>{provenance.tag}</ProvenanceTag>
            <StatusChip tone={toTone(presentation.badgeTone)}>{presentation.badge}</StatusChip>
          </>
        }
      />

      <div className="px-4 pb-3">
        <DefinitionList
          items={presentation.metrics.map((metric) => ({
            label: metric.label,
            value: <span className="font-mono tabular-nums">{metric.value}</span>,
          }))}
        />
      </div>

      <div className="border-t border-[var(--gc-rule)] px-4 py-3">
        <div className="flex items-baseline justify-between gap-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--gc-ink-3)]">
            24-hour profile
          </p>
          <span
            title="A fixed per-region constant held in the frontend, not a comparison computed from the record."
            className="flex items-center gap-1.5 font-mono text-[11.5px] tabular-nums text-[var(--gc-ink-2)]"
          >
            <ProvenanceTag>Fixed</ProvenanceTag>
            {region.demandChange >= 0 ? "+" : ""}
            {region.demandChange.toFixed(1)}% vs previous day
          </span>
        </div>
        <div className="mt-2 h-[92px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={region.sparkline} margin={{ top: 6, right: 2, left: 2, bottom: 2 }}>
              <defs>
                <linearGradient id={`region-spark-${region.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--gc-model)" stopOpacity={0.16} />
                  <stop offset="100%" stopColor="var(--gc-model)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Tooltip
                cursor={{ stroke: "var(--gc-ink-3)", strokeWidth: 1 }}
                contentStyle={{
                  borderColor: "var(--gc-rule-strong)",
                  borderRadius: 6,
                  background: "var(--gc-surface)",
                  fontSize: 11.5,
                }}
                labelStyle={{ color: "var(--gc-ink-3)", fontSize: 10.5 }}
                formatter={(value) => [`${Number(value).toFixed(2)} GW`, "Demand"]}
              />
              <Area
                dataKey="demand"
                type="monotone"
                stroke="var(--gc-model)"
                strokeWidth={2}
                fill={`url(#region-spark-${region.id})`}
                dot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="border-t border-[var(--gc-rule)] px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--gc-ink-3)]">
            Consumer mix
          </span>
          <ProvenanceTag title="Fixed per-region shares held in the frontend. Not measured, and not produced by the model.">
            Fixed shares
          </ProvenanceTag>
        </div>
        <ul className="mt-2.5 space-y-2">
          {consumers.map(([label, value]) => (
            <li key={label}>
              <div className="mb-1 flex items-baseline justify-between text-[12px]">
                <span className="text-[var(--gc-ink-2)]">{label}</span>
                <span className="font-mono tabular-nums text-[var(--gc-ink)]">{value}%</span>
              </div>
              <div className="h-1 bg-[var(--gc-surface-sunk)]">
                <div className="h-full bg-[var(--gc-ink-3)]" style={{ width: `${value}%` }} />
              </div>
            </li>
          ))}
        </ul>
      </div>

      <Note className="border-t border-[var(--gc-rule)] px-4 py-2.5">{provenance.note}</Note>
    </Panel>
  )
}
