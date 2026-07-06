"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Play, RotateCcw } from "lucide-react"

import { ScenarioControls } from "@/components/scenarios/ScenarioControls"
import { ScenarioForecastChart } from "@/components/scenarios/ScenarioForecastChart"
import { ScenarioImpactSummary } from "@/components/scenarios/ScenarioImpactSummary"
import { ScenarioKpis } from "@/components/scenarios/ScenarioKpis"
import { Card, CardContent } from "@/components/ui/card"
import { simulateScenario } from "@/lib/api"
import {
  DEFAULT_SCENARIO,
  toScenarioResults,
  toSimulationRequest,
  type ScenarioInputs,
  type ScenarioResults,
} from "@/lib/scenario-engine"

export function ScenariosDashboard({
  initialResults,
  initialError,
}: {
  initialResults: ScenarioResults | null
  initialError: string | null
}) {
  const [scenarioName, setScenarioName] = useState("High demand sensitivity")
  const [inputs, setInputs] = useState<ScenarioInputs>(DEFAULT_SCENARIO)
  const [animationKey, setAnimationKey] = useState(0)
  const [results, setResults] = useState<ScenarioResults | null>(initialResults)
  const [error, setError] = useState<string | null>(initialError)
  const [isRunning, setIsRunning] = useState(false)
  const requestSequence = useRef(0)
  const skipInitialRequest = useRef(initialResults !== null)

  const runSimulation = useCallback(async (scenarioInputs: ScenarioInputs) => {
    const sequence = ++requestSequence.current
    setIsRunning(true)
    const response = await simulateScenario(toSimulationRequest(scenarioInputs))
    if (sequence !== requestSequence.current) return

    if (response.ok) {
      setResults(toScenarioResults(response.data))
      setError(null)
      setAnimationKey((current) => current + 1)
    } else {
      setError(response.error)
    }
    setIsRunning(false)
  }, [])

  useEffect(() => {
    if (skipInitialRequest.current) {
      skipInitialRequest.current = false
      return
    }
    const timer = window.setTimeout(() => {
      void runSimulation(inputs)
    }, 220)
    return () => window.clearTimeout(timer)
  }, [inputs, runSimulation])

  function updateInput<Key extends keyof ScenarioInputs>(key: Key, value: ScenarioInputs[Key]) {
    setInputs((current) => ({ ...current, [key]: value }))
  }

  function resetScenario() {
    setInputs(DEFAULT_SCENARIO)
  }

  return (
    <main className="mx-auto w-full max-w-[1880px] px-5 py-5 md:px-8 lg:px-10 lg:py-6 2xl:px-12">
      <header className="animate-enter">
        <p className="text-[11px] font-bold uppercase leading-4 tracking-[0.18em] text-[#64748B]">
          Planning
        </p>
        <h1 className="mt-1 text-[40px] font-semibold leading-[0.98] tracking-tight text-[#0F172A]">
          Scenarios
        </h1>
        <p className="mt-2.5 max-w-3xl text-[15px] font-medium leading-6 text-[#64748B]">
          Explore how operational conditions affect the next 48-hour electricity demand forecast.
        </p>
      </header>

      <section className="mt-4 flex flex-col gap-3 border-y border-[#E8EDF5] py-3.5 lg:flex-row lg:items-end lg:justify-between">
        <label className="block w-full max-w-[360px]">
          <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.14em] text-[#94A3B8]">
            Scenario name
          </span>
          <input
            value={scenarioName}
            onChange={(event) => setScenarioName(event.target.value)}
            className="h-9 w-full rounded-[10px] border border-[#E8EDF5] bg-white px-3 text-[13px] font-semibold text-[#0F172A] shadow-[0_8px_20px_rgba(15,23,42,0.035)] outline-none transition-colors placeholder:text-[#94A3B8] focus:border-[#BFDBFE] focus:ring-2 focus:ring-[#2563EB]/15"
            aria-label="Scenario name"
          />
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={resetScenario}
            className="flex h-9 cursor-pointer items-center gap-2 rounded-[10px] border border-[#E8EDF5] bg-white px-3 text-[12px] font-semibold text-[#334155] shadow-[0_8px_20px_rgba(15,23,42,0.035)] transition duration-200 hover:border-[#D7DEE9] hover:bg-[#F8FAFD] focus-visible:ring-2 focus-visible:ring-[#2563EB]/35"
          >
            <RotateCcw className="size-3.5" />
            Reset controls
          </button>
          <button
            type="button"
            onClick={() => void runSimulation(inputs)}
            aria-busy={isRunning}
            className="flex h-9 cursor-pointer items-center gap-2 rounded-[10px] border border-[#2563EB] bg-[#2563EB] px-3.5 text-[12px] font-semibold text-white shadow-[0_12px_28px_rgba(37,99,235,0.18)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_34px_rgba(37,99,235,0.24)] focus-visible:ring-2 focus-visible:ring-[#2563EB]/35"
          >
            <Play className="size-3.5" />
            Run Simulation
          </button>
        </div>
      </section>

      <section className="mt-4 grid items-start gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
        <ScenarioControls inputs={inputs} onChange={updateInput} />
        <div className="min-w-0 space-y-3.5">
          {results ? (
            <>
              <ScenarioKpis results={results} />
              <ScenarioForecastChart results={results} animationKey={animationKey} />
            </>
          ) : (
            <Card className="min-h-[530px]">
              <CardContent className="grid min-h-[530px] place-items-center px-6 text-center">
                <div>
                  <p className="text-[14px] font-semibold text-[#0F172A]">
                    Simulation data unavailable
                  </p>
                  <p className="mt-1.5 max-w-md text-[12px] font-medium leading-5 text-[#64748B]">
                    {error ?? "Waiting for the forecasting service."}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {results ? <ScenarioImpactSummary results={results} /> : null}
    </main>
  )
}
