"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Play, RotateCcw } from "lucide-react"

import { ScenarioControls } from "@/components/scenarios/ScenarioControls"
import { ScenarioForecastChart } from "@/components/scenarios/ScenarioForecastChart"
import { ScenarioImpactSummary } from "@/components/scenarios/ScenarioImpactSummary"
import { ScenarioKpis } from "@/components/scenarios/ScenarioKpis"
import { ApiStatusNotice } from "@/components/layout/ApiStatusNotice"
import { Note, PageHeader, Panel, StatusChip } from "@/components/ui/primitives"
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
    <main className="mx-auto w-full max-w-[1600px] px-4 py-4 md:px-6 lg:px-8">
      <PageHeader
        eyebrow="Planning"
        title="Scenario simulator"
        description="Adjust an operating assumption and re-run the 48-hour forecast against the current baseline."
        actions={
          <>
            <StatusChip tone={isRunning ? "neutral" : error ? "bad" : "ok"}>
              {isRunning ? "Running" : error ? "Failed" : "Up to date"}
            </StatusChip>
            <button
              type="button"
              onClick={resetScenario}
              className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-[5px] border border-[var(--gc-rule-strong)] px-2.5 text-[12.5px] text-[var(--gc-ink-2)] transition-colors hover:bg-[var(--gc-surface-sunk)] hover:text-[var(--gc-ink)]"
            >
              <RotateCcw className="size-3.5" />
              Reset
            </button>
            <button
              type="button"
              onClick={() => void runSimulation(inputs)}
              aria-busy={isRunning}
              className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-[5px] bg-[var(--gc-ink)] px-2.5 text-[12.5px] text-white transition-colors hover:bg-[#2A2E36] disabled:opacity-60"
              disabled={isRunning}
            >
              <Play className="size-3.5" />
              {isRunning ? "Running" : "Run again"}
            </button>
          </>
        }
        meta={
          <label className="block max-w-[320px]">
            <span className="mb-1 block font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--gc-ink-3)]">
              Scenario name
            </span>
            <input
              value={scenarioName}
              onChange={(event) => setScenarioName(event.target.value)}
              className="h-8 w-full rounded-[5px] border border-[var(--gc-rule-strong)] bg-[var(--gc-surface)] px-2.5 text-[12.5px] text-[var(--gc-ink)] outline-none placeholder:text-[var(--gc-ink-3)]"
              aria-label="Scenario name"
              placeholder="Name this scenario"
            />
          </label>
        }
      />

      {error ? <ApiStatusNotice message={error} /> : null}

      <section className="mt-4 grid items-start gap-3 xl:grid-cols-[300px_minmax(0,1fr)]">
        <ScenarioControls inputs={inputs} onChange={updateInput} />
        <div className="min-w-0 space-y-3">
          {results ? (
            <>
              <ScenarioKpis results={results} />
              <div aria-busy={isRunning} className={isRunning ? "opacity-60 transition-opacity" : "transition-opacity"}>
                <ScenarioForecastChart results={results} animationKey={animationKey} />
              </div>
              <ScenarioImpactSummary results={results} />
            </>
          ) : (
            <Panel className="grid min-h-[320px] place-items-center px-6 text-center">
              <div>
                <p className="text-[13.5px] text-[var(--gc-ink)]">Simulation unavailable</p>
                <Note className="mx-auto mt-1.5 max-w-md">
                  {error ?? "Waiting for the forecasting service."}
                </Note>
              </div>
            </Panel>
          )}
        </div>
      </section>
    </main>
  )
}
