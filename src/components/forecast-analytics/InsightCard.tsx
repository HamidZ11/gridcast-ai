import { DefinitionList, Note, Panel, PanelHeader } from "@/components/ui/primitives"

type InsightCardProps = {
  modelName: string
  dataset: string
  validationMape: string
  forecastHorizon: string
  generatedAt: string
}

/**
 * The provenance of everything on this screen, as a plain spec list.
 * Previously a saturated brand block; the values matter more than the surface.
 */
export function InsightCard({
  modelName,
  dataset,
  validationMape,
  forecastHorizon,
  generatedAt,
}: InsightCardProps) {
  return (
    <Panel className="animate-enter">
      <PanelHeader eyebrow="Provenance" title="What produced these numbers" />
      <div className="px-4 pb-3">
        <DefinitionList
          items={[
            { label: "Active model", value: modelName },
            { label: "Training data", value: dataset },
            {
              label: "Held-out MAPE",
              value: <span className="font-mono tabular-nums">{validationMape}</span>,
              detail: "one step ahead",
            },
            { label: "Forecast horizon", value: forecastHorizon, detail: "recursive, not backtested" },
            {
              label: "Forecast generated",
              value: <span className="font-mono text-[11.5px]">{generatedAt}</span>,
            },
          ]}
        />
        <Note className="mt-3">
          The held-out figure measures the next half-hour, where the previous observation is known.
          It is not a measured accuracy for the full 48-hour horizon.
        </Note>
      </div>
    </Panel>
  )
}
