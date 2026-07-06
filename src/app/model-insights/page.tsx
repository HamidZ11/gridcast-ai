import { ConfidenceCard } from "@/components/model-insights/ConfidenceCard"
import { ExplainabilityPanel } from "@/components/model-insights/ExplainabilityPanel"
import { FeatureImportanceChart } from "@/components/model-insights/FeatureImportanceChart"
import { ApiStatusNotice } from "@/components/layout/ApiStatusNotice"
import { ModelSummaryCard } from "@/components/model-insights/ModelSummaryCard"
import { PerformanceTable } from "@/components/model-insights/PerformanceTable"
import { TechnicalSummary } from "@/components/model-insights/TechnicalSummary"
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

  return (
    <main className="mx-auto w-full max-w-[1880px] px-5 py-5 md:px-8 lg:px-10 lg:py-6 2xl:px-12">
      <div className="animate-enter flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase leading-4 tracking-[0.18em] text-[#64748B]">
            Model Intelligence
          </p>
          <h1 className="mt-1 text-[40px] font-semibold leading-[0.98] tracking-tight text-[#0F172A] md:text-[40px]">
            Model Insights
          </h1>
          <p className="mt-2.5 max-w-3xl text-[15px] font-medium leading-6 text-[#64748B]">
            Performance, feature influence, and explainability for the GridCast AI demand forecasting model.
          </p>
        </div>
        <div className="grid w-fit gap-1 rounded-[18px] border border-[#E8EDF5] bg-white px-3.5 py-2.5 text-right shadow-[0_14px_34px_rgba(15,23,42,0.045)]">
          <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#94A3B8]">Production model</span>
          <span className="text-sm font-semibold text-[#0F172A]">{productionLabel}</span>
        </div>
      </div>

      {notice ? <ApiStatusNotice message={notice} /> : null}

      <section className="mt-4 grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        {modelSummary.map((item, index) => (
          <ModelSummaryCard key={item.label} item={item} index={index} />
        ))}
      </section>

      <section className="mt-3.5">
        <PerformanceTable rows={performanceComparison} />
      </section>

      <section className="mt-3.5">
        <FeatureImportanceChart data={featureImportance} method={featureImportanceMethod} />
      </section>

      <section className="mt-3.5 grid gap-3.5 xl:grid-cols-[1.08fr_0.92fr]">
        <ExplainabilityPanel
          predictedPeak={peakExplanation.predictedPeak}
          basePrediction={peakExplanation.basePrediction}
          unit={peakExplanation.unit}
          window={peakExplanation.window}
          contributions={peakExplanation.contributions}
        />
        <ConfidenceCard value={modelConfidence.value} text={modelConfidence.text} />
      </section>

      <section className="mt-3.5">
        <TechnicalSummary items={technicalSummary} />
      </section>
    </main>
  )
}
