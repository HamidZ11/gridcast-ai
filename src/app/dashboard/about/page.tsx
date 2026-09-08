import { ExternalLink } from "lucide-react"

import {
  DefinitionList,
  Note,
  PageHeader,
  Panel,
  PanelHeader,
  StatusChip,
} from "@/components/ui/primitives"
import { getAboutPageData } from "@/lib/about-data"

const technologies = [
  "Next.js",
  "React",
  "TypeScript",
  "Tailwind CSS",
  "Recharts",
  "FastAPI",
  "SHAP",
  "Pydantic",
  "scikit-learn",
  "Pandas",
  "NumPy",
]

const limitations = [
  "The production baseline uses historical demand and calendar features only.",
  "Weather observations and forecasts are not integrated.",
  "Scenario inputs without trained features apply documented provisional adjustments.",
  "Regional map layers are derived, heuristic or illustrative — never regional forecasts. Each layer says which.",
  "Reported accuracy is one step ahead; the recursive 48-hour horizon has no backtest.",
]

const dataFacts = [
  ["Source", "National Energy System Operator open data portal"],
  ["Licence", "NESO Open Data Licence"],
  ["Update cadence", "Published ~21 days in arrears, with retrospective corrections"],
  ["Training file", "Historic Demand Data 2024"],
  ["Resolution", "Half-hourly settlement periods"],
] as const

export default async function AboutPage() {
  const { machineLearning, system } = await getAboutPageData()
  const backendStatus = system.find((item) => item.label === "Backend status")?.value ?? "Unavailable"

  return (
    <main className="mx-auto w-full max-w-[1600px] px-4 py-4 md:px-6 lg:px-8">
      <PageHeader
        eyebrow="Reference"
        title="About this system"
        description="A portfolio engineering project, not an operational control system and not a substitute for official NESO forecasting."
        actions={
          <StatusChip tone={backendStatus === "Operational" ? "ok" : "bad"}>Backend {backendStatus}</StatusChip>
        }
      />

      <section className="mt-4 grid items-start gap-3 xl:grid-cols-2">
        <Panel>
          <PanelHeader
            eyebrow="Model"
            title="Production foundation"
            note="Read from the saved model metadata when the backend is available."
          />
          <div className="px-4 pb-3">
            <DefinitionList
              items={machineLearning.map((item) => ({
                label: item.label,
                value: <span className="font-mono text-[12px] tabular-nums">{item.value}</span>,
              }))}
            />
          </div>
        </Panel>

        <Panel>
          <PanelHeader eyebrow="Runtime" title="This deployment" />
          <div className="px-4 pb-3">
            <DefinitionList
              items={system.map((item) => ({
                label: item.label,
                value: <span className="font-mono text-[12px] tabular-nums">{item.value}</span>,
              }))}
            />
          </div>
        </Panel>
      </section>

      <section className="mt-3 grid items-start gap-3 xl:grid-cols-2">
        <Panel>
          <PanelHeader eyebrow="Data" title="NESO historic demand" />
          <div className="px-4 pb-3">
            <DefinitionList
              items={dataFacts.map(([label, value]) => ({ label, value }))}
            />
            <div className="mt-3 flex flex-wrap gap-4">
              <a
                href="https://www.neso.energy/data-portal/historic-demand-data"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 border-b border-[var(--gc-ink)]/25 pb-px text-[12px] text-[var(--gc-ink)] transition-colors hover:border-[var(--gc-model)] hover:text-[var(--gc-model)]"
              >
                Dataset <ExternalLink className="size-3" />
              </a>
              <a
                href="https://www.neso.energy/data-portal/ngeso-open-licence"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 border-b border-[var(--gc-ink)]/25 pb-px text-[12px] text-[var(--gc-ink)] transition-colors hover:border-[var(--gc-model)] hover:text-[var(--gc-model)]"
              >
                Licence <ExternalLink className="size-3" />
              </a>
            </div>
          </div>
        </Panel>

        <Panel>
          <PanelHeader eyebrow="Scope" title="What this does not do" />
          <ul className="px-4 pb-3">
            {limitations.map((limitation) => (
              <li
                key={limitation}
                className="border-b border-[var(--gc-rule)] py-2.5 text-[12.5px] leading-[1.55] text-[var(--gc-ink-2)] last:border-b-0"
              >
                {limitation}
              </li>
            ))}
          </ul>
        </Panel>
      </section>

      <section className="mt-3 grid items-start gap-3 xl:grid-cols-[1.15fr_0.85fr]">
        <Panel>
          <PanelHeader eyebrow="Stack" title="Built with" />
          <ul className="flex flex-wrap gap-1.5 px-4 py-3">
            {technologies.map((technology) => (
              <li
                key={technology}
                className="rounded-[4px] border border-[var(--gc-rule)] bg-[var(--gc-paper)] px-2 py-1 font-mono text-[11px] text-[var(--gc-ink-2)]"
              >
                {technology}
              </li>
            ))}
          </ul>
          <Note className="border-t border-[var(--gc-rule)] px-4 py-2.5">
            SHAP is a declared backend dependency. If it is absent from a deployment the API
            degrades rather than failing: feature importance falls back to the estimator&apos;s own
            coefficients and local explanations are withheld.
          </Note>
        </Panel>

        <Panel>
          <PanelHeader eyebrow="Repository" title="Source and documentation" />
          <ul className="px-4 pb-3">
            {[
              { label: "README", value: "README.md" },
              { label: "Project notes", value: "PROJECT_CONTEXT.md · ROADMAP.md" },
              {
                label: "Repository",
                value: "github.com/HamidZ11/gridcast-ai",
                href: "https://github.com/HamidZ11/gridcast-ai",
              },
            ].map((resource) => (
              <li
                key={resource.label}
                className="flex items-baseline justify-between gap-4 border-b border-[var(--gc-rule)] py-2.5 last:border-b-0"
              >
                <span className="text-[12.5px] text-[var(--gc-ink-3)]">{resource.label}</span>
                {resource.href ? (
                  <a
                    href={resource.href}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-mono text-[11.5px] text-[var(--gc-ink)] transition-colors hover:text-[var(--gc-model)]"
                  >
                    {resource.value}
                    <ExternalLink className="size-3" />
                  </a>
                ) : (
                  <span className="font-mono text-[11.5px] text-[var(--gc-ink-2)]">{resource.value}</span>
                )}
              </li>
            ))}
          </ul>
        </Panel>
      </section>
    </main>
  )
}
