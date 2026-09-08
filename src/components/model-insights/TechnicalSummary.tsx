import { DefinitionList, Note, Panel, PanelHeader } from "@/components/ui/primitives"
import type { TechnicalSummaryItem } from "@/types/dashboard"

type TechnicalSummaryProps = {
  items: TechnicalSummaryItem[]
}

/**
 * Training and data facts. Limitations are rendered once, on their own, rather
 * than repeated inside a metric tile and again here.
 */
export function TechnicalSummary({ items }: TechnicalSummaryProps) {
  const limitations = items.find((item) => item.label === "Limitations")
  const spec = items.filter((item) => item.label !== "Limitations")

  return (
    <Panel className="animate-enter">
      <PanelHeader eyebrow="Training" title="Data and evaluation setup" />
      {spec.length === 0 ? (
        <Note className="px-4 py-6">Training metadata is unavailable.</Note>
      ) : (
        <div className="px-4 pb-3">
          <DefinitionList
            items={spec.map((item) => ({
              label: item.label,
              value:
                item.label === "Feature schema" ? (
                  <span className="flex flex-wrap justify-end gap-1">
                    {item.value.split(", ").map((feature) => (
                      <span
                        key={feature}
                        className="rounded-[3px] border border-[var(--gc-rule)] bg-[var(--gc-paper)] px-1.5 py-px font-mono text-[10.5px] text-[var(--gc-ink-2)]"
                      >
                        {feature}
                      </span>
                    ))}
                  </span>
                ) : (
                  <span className="font-mono tabular-nums text-[12px]">{item.value}</span>
                ),
            }))}
          />
        </div>
      )}

      {limitations ? (
        <div className="border-t border-[var(--gc-rule)] px-4 py-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--gc-ink-3)]">
            Documented limitations
          </p>
          <ul className="mt-2 space-y-1.5">
            {limitations.value
              .split(". ")
              .filter(Boolean)
              .map((sentence) => (
                <li key={sentence} className="text-[12.5px] leading-[1.5] text-[var(--gc-ink-2)]">
                  {sentence.endsWith(".") ? sentence : `${sentence}.`}
                </li>
              ))}
          </ul>
        </div>
      ) : null}
    </Panel>
  )
}
