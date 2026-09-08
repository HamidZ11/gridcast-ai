import { AlertTriangle } from "lucide-react"

type ApiStatusNoticeProps = {
  message: string
}

/**
 * Shown when a screen could not source part of its data. It is an error state,
 * so it carries the reserved status colour plus an icon and text - never colour
 * alone.
 */
export function ApiStatusNotice({ message }: ApiStatusNoticeProps) {
  return (
    <div
      role="status"
      className="mt-3 flex items-start gap-2 rounded-[6px] border border-[var(--gc-rule-strong)] bg-[var(--gc-surface)] px-3 py-2"
    >
      <AlertTriangle aria-hidden className="mt-px size-3.5 shrink-0 text-[var(--gc-bad)]" />
      <p className="text-[12px] leading-[1.5] text-[var(--gc-ink-2)]">{message}</p>
    </div>
  )
}
