import { ScenariosDashboard } from "@/components/scenarios/ScenariosDashboard"
import { simulateScenario } from "@/lib/api"
import {
  DEFAULT_SCENARIO,
  toScenarioResults,
  toSimulationRequest,
} from "@/lib/scenario-engine"

export default async function ScenariosPage() {
  const initialSimulation = await simulateScenario(
    toSimulationRequest(DEFAULT_SCENARIO)
  )

  return (
    <ScenariosDashboard
      initialResults={
        initialSimulation.ok ? toScenarioResults(initialSimulation.data) : null
      }
      initialError={
        initialSimulation.ok ? null : initialSimulation.error
      }
    />
  )
}
