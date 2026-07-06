import {
  BrainCircuit,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Database,
  FileClock,
  RefreshCw,
} from "lucide-react"

import { ApiStatusNotice } from "@/components/layout/ApiStatusNotice"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import type { JobStatus } from "@/data/mockSchedulesData"
import { cn } from "@/lib/utils"
import { getSchedulesPageData } from "@/lib/page-data"

const overviewIcons = [Clock3, CalendarClock, BrainCircuit, Database]

function statusClasses(status: JobStatus) {
  if (status === "Completed") return "border-[#A7F3D0] bg-[#ECFDF5] text-[#047857]"
  if (status === "Monitoring") return "border-[#BFDBFE] bg-[#EFF6FF] text-[#2563EB]"
  return "border-[#E8EDF5] bg-[#F8FAFD] text-[#64748B]"
}

export default async function SchedulesPage() {
  const { overview, jobs, retraining, refreshTimeline, notice } = await getSchedulesPageData()

  return (
    <main className="mx-auto w-full max-w-[1880px] px-5 py-5 md:px-8 lg:px-10 lg:py-6 2xl:px-12">
      <header className="animate-enter">
        <p className="text-[11px] font-bold uppercase leading-4 tracking-[0.18em] text-[#64748B]">
          Operations
        </p>
        <h1 className="mt-1 text-[40px] font-semibold leading-[0.98] tracking-tight text-[#0F172A]">
          Schedules
        </h1>
        <p className="mt-2.5 max-w-3xl text-[15px] font-medium leading-6 text-[#64748B]">
          Forecast jobs, retraining cadence, dataset refreshes, and model operations.
        </p>
      </header>

      {notice ? <ApiStatusNotice message={notice} /> : null}

      <section className="mt-4 grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        {overview.map((item, index) => {
          const Icon = overviewIcons[index]

          return (
            <Card key={item.label} className="min-h-[130px]">
              <CardContent className="flex h-full items-start justify-between gap-4 px-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[11px] font-semibold text-[#64748B]">{item.label}</p>
                    {item.source === "operations mock" ? (
                      <span className="text-[8px] font-bold uppercase tracking-[0.1em] text-[#94A3B8]">Mock ops</span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-[17px] font-semibold leading-6 tracking-tight text-[#0F172A]">{item.value}</p>
                  <p className="mt-2 text-[11px] font-medium leading-4 text-[#94A3B8]">{item.detail}</p>
                </div>
                <div className="grid size-9 shrink-0 place-items-center rounded-[11px] bg-[#F3F6FB] text-[#64748B]">
                  <Icon className="size-4" />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </section>

      <section className="mt-3.5">
        <Card className="animate-enter-slow">
          <CardHeader className="flex flex-row items-start justify-between gap-4 px-5 pt-5 md:px-6">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#94A3B8]">
                Forecast Jobs
              </p>
              <h2 className="mt-1.5 text-[22px] font-semibold leading-7 tracking-tight text-[#0F172A]">
                Model operations queue
              </h2>
            </div>
            <span className="rounded-full border border-[#E8EDF5] bg-[#F8FAFD] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-[#94A3B8]">
              Operations mock where unavailable
            </span>
          </CardHeader>
          <CardContent className="px-0 pb-2">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] border-collapse text-left text-[13px]">
                <thead>
                  <tr className="border-y border-[#E8EDF5] bg-[#F8FAFD] text-[10px] font-bold uppercase tracking-[0.14em] text-[#94A3B8]">
                    <th className="px-6 py-2.5">Job</th>
                    <th className="px-4 py-2.5">Type</th>
                    <th className="px-4 py-2.5">Model</th>
                    <th className="px-4 py-2.5">Started</th>
                    <th className="px-4 py-2.5">Duration</th>
                    <th className="px-6 py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8EDF5]">
                  {jobs.map((job) => (
                    <tr key={job.job} className="transition-colors hover:bg-[#FBFCFE]">
                      <td className="px-6 py-3 font-semibold text-[#0F172A]">{job.job}</td>
                      <td className="px-4 py-3 font-medium text-[#64748B]">{job.type}</td>
                      <td className="px-4 py-3 font-medium text-[#64748B]">{job.model}</td>
                      <td className="px-4 py-3 font-medium tabular-nums text-[#64748B]">{job.started}</td>
                      <td className="px-4 py-3 font-medium tabular-nums text-[#64748B]">{job.duration}</td>
                      <td className="px-6 py-3">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                            statusClasses(job.status)
                          )}
                        >
                          {job.status === "Completed" ? <CheckCircle2 className="size-3.5" /> : null}
                          {job.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="mt-3.5 grid gap-3.5 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader className="px-5 pt-5 md:px-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#94A3B8]">
              Retraining Schedule
            </p>
            <h2 className="mt-1.5 text-[22px] font-semibold leading-7 tracking-tight text-[#0F172A]">
              Active model cadence
            </h2>
          </CardHeader>
          <CardContent className="divide-y divide-[#E8EDF5]">
            {retraining.map((item) => (
              <div key={item.label} className="flex items-start justify-between gap-5 py-3 first:pt-1 last:pb-0">
                <div className="flex items-center gap-2">
                  <p className="text-[12px] font-semibold text-[#64748B]">{item.label}</p>
                  {item.source === "operations mock" ? (
                    <span className="text-[8px] font-bold uppercase tracking-[0.1em] text-[#94A3B8]">Mock ops</span>
                  ) : null}
                </div>
                <p className="max-w-[62%] text-right text-[13px] font-semibold leading-5 text-[#0F172A]">{item.value}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="px-5 pt-5 md:px-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#94A3B8]">
              Data Refresh Timeline
            </p>
            <h2 className="mt-1.5 text-[22px] font-semibold leading-7 tracking-tight text-[#0F172A]">
              Artifact update sequence
            </h2>
          </CardHeader>
          <CardContent>
            <div className="relative space-y-0 before:absolute before:bottom-4 before:left-[15px] before:top-3 before:w-px before:bg-[#E8EDF5]">
              {refreshTimeline.map((item, index) => (
                <div key={item.label} className="relative flex gap-3.5 pb-4 last:pb-0">
                  <div className="z-[1] grid size-8 shrink-0 place-items-center rounded-[10px] border border-[#E8EDF5] bg-white text-[#64748B]">
                    {index === refreshTimeline.length - 1 ? (
                      <RefreshCw className="size-3.5" />
                    ) : (
                      <FileClock className="size-3.5" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-[13px] font-semibold text-[#0F172A]">{item.label}</p>
                      <span className="text-[10px] font-semibold text-[#94A3B8]">{item.cadence}</span>
                    </div>
                    <p className="mt-1 text-[11px] font-medium text-[#64748B]">Last update: {item.lastUpdated}</p>
                    <p className="mt-0.5 text-[11px] font-medium text-[#94A3B8]">Next: {item.nextAction}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="mt-3.5">
        <Card>
          <CardHeader className="px-5 pt-5 md:px-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#94A3B8]">System Notes</p>
            <h2 className="mt-1.5 text-[22px] font-semibold leading-7 tracking-tight text-[#0F172A]">
              Current operating constraints
            </h2>
          </CardHeader>
          <CardContent className="grid gap-2.5 md:grid-cols-3">
            {[
              "NESO data is published 21 days in arrears.",
              "Weather features are not yet integrated.",
              "Current inference uses lag and rolling demand features.",
            ].map((note) => (
              <div key={note} className="rounded-[15px] border border-[#E8EDF5] bg-[#F8FAFD] p-3.5">
                <p className="text-[12px] font-medium leading-5 text-[#475569]">{note}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
