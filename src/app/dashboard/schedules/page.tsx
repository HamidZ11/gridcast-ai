import { ApiStatusNotice } from "@/components/layout/ApiStatusNotice"
import {
  DefinitionList,
  Eyebrow,
  Note,
  PageHeader,
  Panel,
  PanelHeader,
  ProvenanceTag,
  StatusChip,
} from "@/components/ui/primitives"
import type { JobStatus } from "@/data/mockSchedulesData"
import { getSchedulesPageData } from "@/lib/page-data"

function statusTone(status: JobStatus) {
  if (status === "Completed") return "ok" as const
  if (status === "Monitoring") return "neutral" as const
  return "neutral" as const
}

export default async function SchedulesPage() {
  const { overview, jobs, retraining, refreshTimeline, notice } = await getSchedulesPageData()

  return (
    <main className="mx-auto w-full max-w-[1600px] px-4 py-4 md:px-6 lg:px-8">
      <PageHeader
        eyebrow="Operations"
        title="Runs and cadence"
        description="What has run, what is due, and which of these values are real backend readings."
        actions={<ProvenanceTag title="Rows marked MOCK OPS are placeholders held in the frontend, because no scheduler backs them yet.">Mock ops where marked</ProvenanceTag>}
      />

      {notice ? <ApiStatusNotice message={notice} /> : null}

      <section
        aria-label="Run status"
        className="mt-4 grid divide-y divide-[var(--gc-rule)] rounded-[8px] border border-[var(--gc-rule-strong)] bg-[var(--gc-surface)] sm:grid-cols-2 sm:divide-y-0 sm:[&>*:nth-child(n+3)]:border-t sm:[&>*:nth-child(n+3)]:border-[var(--gc-rule)] sm:[&>*:nth-child(even)]:border-l sm:[&>*:nth-child(even)]:border-[var(--gc-rule)] xl:grid-cols-4 xl:[&>*:not(:first-child)]:border-l xl:[&>*:not(:first-child)]:border-[var(--gc-rule)] xl:[&>*:nth-child(n+3)]:border-t-0"
      >
        {overview.map((item) => (
          <div key={item.label} className="min-w-0 px-4 py-3.5">
            <div className="flex items-center gap-2">
              <Eyebrow>{item.label}</Eyebrow>
              {item.source === "operations mock" ? <ProvenanceTag>Mock ops</ProvenanceTag> : null}
            </div>
            <p className="mt-2 font-mono text-[14px] leading-[1.35] tabular-nums text-[var(--gc-ink)]">
              {item.value}
            </p>
            <p className="mt-1.5 text-[11.5px] leading-[1.45] text-[var(--gc-ink-3)]">{item.detail}</p>
          </div>
        ))}
      </section>

      <section className="mt-3">
        <Panel>
          <PanelHeader
            eyebrow="Queue"
            title="Model operations"
            note="Start times come from the backend where a real artifact records one; the rest are placeholders."
          />
          <div className="gc-scroll-x">
            <table className="w-full min-w-[760px] border-collapse text-left">
              <thead>
                <tr className="border-b border-[var(--gc-rule-strong)]">
                  {["Job", "Type", "Model", "Started", "Duration", "Status"].map((heading, index) => (
                    <th
                      key={heading}
                      scope="col"
                      className={`px-4 py-2 font-mono text-[10px] font-normal uppercase tracking-[0.07em] text-[var(--gc-ink-3)] ${
                        index === 5 ? "text-right" : ""
                      }`}
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job.job} className="border-b border-[var(--gc-rule)] last:border-b-0">
                    <th scope="row" className="px-4 py-2.5 text-left text-[12.5px] font-normal text-[var(--gc-ink)]">
                      {job.job}
                    </th>
                    <td className="px-4 py-2.5 text-[12.5px] text-[var(--gc-ink-2)]">{job.type}</td>
                    <td className="px-4 py-2.5 text-[12.5px] text-[var(--gc-ink-2)]">{job.model}</td>
                    <td className="whitespace-nowrap px-4 py-2.5 font-mono text-[12px] tabular-nums text-[var(--gc-ink-2)]">
                      {job.started}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 font-mono text-[12px] tabular-nums text-[var(--gc-ink-3)]">
                      {job.duration}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <StatusChip tone={statusTone(job.status)}>{job.status}</StatusChip>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </section>

      <section className="mt-3 grid items-start gap-3 xl:grid-cols-[0.85fr_1.15fr]">
        <Panel>
          <PanelHeader eyebrow="Retraining" title="Active model cadence" />
          <div className="px-4 pb-3">
            <DefinitionList
              items={retraining.map((item) => ({
                label: item.label,
                value: (
                  <span className="inline-flex flex-wrap items-baseline justify-end gap-1.5">
                    {item.source === "operations mock" ? <ProvenanceTag>Mock ops</ProvenanceTag> : null}
                    <span className="font-mono text-[12px] tabular-nums">{item.value}</span>
                  </span>
                ),
              }))}
            />
          </div>
        </Panel>

        <Panel>
          <PanelHeader eyebrow="Data" title="Artifact update sequence" />
          <ol className="px-4 pb-3">
            {refreshTimeline.map((item) => (
              <li
                key={item.label}
                className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-[var(--gc-rule)] py-2.5 last:border-b-0"
              >
                <div className="min-w-0">
                  <p className="text-[12.5px] text-[var(--gc-ink)]">{item.label}</p>
                  <p className="mt-0.5 font-mono text-[11px] tabular-nums text-[var(--gc-ink-3)]">
                    Last update {item.lastUpdated}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-[10px] uppercase tracking-[0.07em] text-[var(--gc-ink-3)]">
                    {item.cadence}
                  </p>
                  <p className="mt-0.5 text-[11.5px] text-[var(--gc-ink-2)]">Next: {item.nextAction}</p>
                </div>
              </li>
            ))}
          </ol>
        </Panel>
      </section>

      <section className="mt-3">
        <Panel>
          <PanelHeader eyebrow="Constraints" title="What limits the cadence" />
          <ul className="px-4 pb-3">
            {[
              "NESO publishes historic demand roughly 21 days in arrears, so there is no same-day data to ingest.",
              "Weather features are not integrated, so a retrain would not change what the model can see.",
              "Inference uses lag and rolling-demand features only, recomputed from the processed dataset.",
            ].map((note) => (
              <li
                key={note}
                className="border-b border-[var(--gc-rule)] py-2.5 text-[12.5px] leading-[1.55] text-[var(--gc-ink-2)] last:border-b-0"
              >
                {note}
              </li>
            ))}
          </ul>
          <Note className="border-t border-[var(--gc-rule)] px-4 py-2.5">
            No scheduler runs these jobs today. Cadences describe the intended operating model.
          </Note>
        </Panel>
      </section>
    </main>
  )
}
