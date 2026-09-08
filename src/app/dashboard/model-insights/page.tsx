import { ApiStatusNotice } from "@/components/layout/ApiStatusNotice"
import { ConfidenceCard } from "@/components/model-insights/ConfidenceCard"
import { ExplainabilityPanel } from "@/components/model-insights/ExplainabilityPanel"
import { FeatureImportanceChart } from "@/components/model-insights/FeatureImportanceChart"
import { PerformanceTable } from "@/components/model-insights/PerformanceTable"
import { TechnicalSummary } from "@/components/model-insights/TechnicalSummary"
import { DefinitionList, Note, PageHeader, Panel, PanelHeader, StatusChip } from "@/components/ui/primitives"
import { getModelInsightsPageData } from "@/lib/page-data"

export default async function ModelInsightsPage() {
  const {
    productionLabel,
    modelSummary,
    performanceComparison,
    featureImportance,
    featureImportanceMethod,
    modelConfidence,
    peakExplanation,
    technicalSummary,
    notice,
  } = await getModelInsightsPageData()

  // The limitations count is rendered in full further down; keep it out of the spec list.
  const spec = modelSummary.filter((item) => item.label !== "Model limitations")

  return (
    <main className="mx-auto w-full max-w-[1600px] px-4 py-4 md:px-6 lg:px-8">
      <PageHeader
        eyebrow="Model"
        title="Model insights"
        description="Which model is serving forecasts, how it scored, and what moves its output."
        actions={<StatusChip tone={productionLabel === "Model unavailable" ? "bad" : "ok"}>{productionLabel}</StatusChip>}
      />

      {notice ? <ApiStatusNotice message={notice} /> : null}

      <div className="mt-4 grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
        <Panel className="animate-enter self-start">
          <PanelHeader eyebrow="Artifact" title="Active model" />
          {spec.length === 0 ? (
            <Note className="px-4 py-6">No saved model artifact could be read.</Note>
          ) : (
            <div className="px-4 pb-3">
              <DefinitionList
                items={spec.map((item) => ({
                  label: item.label,
                  value: <span className="font-mono text-[12px] tabular-nums">{item.value}</span>,
                  detail: item.detail,
                }))}
              />
            </div>
          )}
        </Panel>

        <div className="grid min-w-0 content-start gap-3">
          <PerformanceTable rows={performanceComparison} />
          <ConfidenceCard value={modelConfidence.value} text={modelConfidence.text} />
        </div>
      </div>

      <section className="mt-3 grid items-start gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <FeatureImportanceChart data={featureImportance} method={featureImportanceMethod} />
        <ExplainabilityPanel
          predictedPeak={peakExplanation.predictedPeak}
          basePrediction={peakExplanation.basePrediction}
          unit={peakExplanation.unit}
          window={peakExplanation.window}
          contributions={peakExplanation.contributions}
        />
      </section>

      <section className="mt-3">
        <TechnicalSummary items={technicalSummary} />
      </section>
    </main>
  )
}
