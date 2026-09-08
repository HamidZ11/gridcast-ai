import { HelpTooltip } from "@/components/ui/help-tooltip"
import { Figure, Note, Panel, PanelHeader } from "@/components/ui/primitives"

type ConfidenceCardProps = {
  value: number | null
  text: string
}

/**
 * Previously "Model confidence", shown as a filled meter at 98.6%.
 *
 * That framing implied a verified confidence level for the product's 48-hour
 * output. The figure is 100 minus the one-step-ahead held-out MAPE, so it is
 * labelled as exactly that, and the meter is gone - a bar that is always ~99%
 * full carries no information and reads as a health gauge.
 */
export function ConfidenceCard({ value, text }: ConfidenceCardProps) {
  return (
    <Panel className="animate-enter">
      <PanelHeader eyebrow="Accuracy" title="Held-out accuracy, one step ahead" />
      <div className="px-4 py-4">
        <Figure
          label="100 − MAPE on the held-out split"
          value={value === null ? "--" : value.toFixed(1)}
          unit={value === null ? undefined : "%"}
          state={value === null ? "unavailable" : "value"}
        />
        <Note className="mt-3">{text}</Note>
        <Note className="mt-2 flex items-start gap-1">
          Measured where the previous half-hour is known. The dashboard&apos;s 48-hour horizon feeds
          each prediction back in, so its error is larger and is not measured here.
          <HelpTooltip content="A rolling-origin backtest would be needed to report accuracy for the full recursive horizon. That is listed as planned work, not implemented." />
        </Note>
      </div>
    </Panel>
  )
}
