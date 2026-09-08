"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

const GITHUB_URL = "https://github.com/HamidZ11/gridcast-ai"

const NAV = [
  { label: "Problem", target: "problem" },
  { label: "Evidence", target: "evidence" },
  { label: "Build", target: "build" },
  { label: "Dashboard", target: "dashboard" },
  { label: "Limits", target: "limits" },
]

export function LandingHeader() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <>
    <header
      className={[
        "sticky top-0 z-50 bg-[var(--gc-paper)]/96 backdrop-blur-[8px] transition-[border-color] duration-200",
        scrolled ? "border-b border-[var(--gc-rule)]" : "border-b border-transparent",
      ].join(" ")}
    >
      <nav
        aria-label="Primary"
        className="mx-auto flex h-14 w-full max-w-[1180px] items-center gap-4 px-5 sm:px-8"
      >
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gc-model)]/50"
          aria-label="GridCast AI, home"
        >
          <span aria-hidden className="h-2 w-2 rounded-full bg-[var(--gc-model)]" />
          <span className="text-[14px] font-medium tracking-[-0.015em] text-[var(--gc-ink)]">GridCast AI</span>
        </Link>

        <div className="ml-auto flex items-center gap-5 sm:gap-6">
          <div className="hidden items-center gap-5 md:flex lg:gap-6">
            {NAV.map((item) => (
              <a
                key={item.target}
                href={`#${item.target}`}
                className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--gc-ink-3)] transition-colors hover:text-[var(--gc-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gc-model)]/50"
              >
                {item.label}
              </a>
            ))}
          </div>
          <span aria-hidden className="hidden h-3.5 w-px bg-[var(--gc-rule-strong)] md:block" />
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--gc-ink-3)] transition-colors hover:text-[var(--gc-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gc-model)]/50"
          >
            Source
          </a>
          <Link
            href="/dashboard"
            className="inline-flex h-8 items-center rounded-[5px] bg-[var(--gc-ink)] px-3 text-[12.5px] font-medium text-white transition-colors hover:bg-[#2A2E36] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gc-model)]/50"
          >
            Dashboard
          </Link>
        </div>
      </nav>

    </header>

      {/* narrow screens keep section wayfinding as a scrollable rail rather than
          hiding it behind a menu. It is deliberately NOT sticky - on a 844px
          viewport a second fixed bar costs more than it returns. */}
      <div className="border-b border-[var(--gc-rule)] bg-[var(--gc-paper)] md:hidden">
        <div className="flex gap-5 overflow-x-auto px-5 py-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {NAV.map((item) => (
            <a
              key={item.target}
              href={`#${item.target}`}
              className="shrink-0 font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--gc-ink-3)] transition-colors hover:text-[var(--gc-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gc-model)]/50"
            >
              {item.label}
            </a>
          ))}
        </div>
      </div>
    </>
  )
}
