"use client"

import { CircleHelp } from "lucide-react"
import { Tooltip } from "radix-ui"

import { cn } from "@/lib/utils"

type HelpTooltipProps = {
  content: string
  label?: string
  className?: string
  iconClassName?: string
  side?: "top" | "right" | "bottom" | "left"
}

export function HelpTooltip({
  content,
  label = "More information",
  className,
  iconClassName,
  side = "top",
}: HelpTooltipProps) {
  return (
    <Tooltip.Provider delayDuration={180} skipDelayDuration={80}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <button
            type="button"
            aria-label={label}
            className={cn(
              "inline-grid size-4 shrink-0 cursor-help place-items-center rounded-full text-[var(--gc-ink-3)] transition-colors duration-150 hover:text-[var(--gc-ink)]",
              className
            )}
          >
            <CircleHelp className={cn("size-3.5", iconClassName)} />
          </button>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            side={side}
            sideOffset={7}
            collisionPadding={12}
            className="z-[100] max-w-[300px] rounded-[6px] border border-[var(--gc-rule-strong)] bg-[var(--gc-surface)] px-2.5 py-1.5 text-left font-sans text-[12px] font-normal normal-case leading-[1.5] tracking-normal text-[var(--gc-ink-2)] shadow-[0_12px_32px_rgba(20,22,26,0.14)]"
          >
            {content}
            <Tooltip.Arrow className="fill-[var(--gc-surface)]" width={10} height={5} />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  )
}
