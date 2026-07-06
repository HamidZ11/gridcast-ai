"use client"

import { ArrowRight, Menu, X } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

const GITHUB_URL = "https://github.com/HamidZ11/gridcast-ai"

const navigation = [
  { label: "Product", target: "product" },
  { label: "Architecture", target: "architecture" },
  { label: "Machine Learning", target: "machine-learning" },
  { label: "Documentation", target: "documentation" },
]

export function LandingHeader() {
  const [mobileOpen, setMobileOpen] = useState(false)

  function scrollToSection(target: string) {
    setMobileOpen(false)
    document.getElementById(target)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    })
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-[#E8EDF5] bg-white/95">
      <nav
        aria-label="Primary navigation"
        className="relative mx-auto flex h-16 w-full max-w-[1480px] items-center justify-between gap-3 px-5 md:px-8 lg:gap-6 lg:px-10"
      >
        <Link href="/" className="shrink-0" aria-label="GridCast AI home">
          <span className="text-[15px] font-semibold tracking-tight text-[#0F172A]">GridCast AI</span>
        </Link>

        <div className="hidden items-center gap-7 lg:flex">
          {navigation.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => scrollToSection(item.target)}
              className="cursor-pointer text-[12px] font-semibold text-[#64748B] transition-colors hover:text-[#0F172A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/30"
            >
              {item.label}
            </button>
          ))}
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            className="text-[12px] font-semibold text-[#64748B] transition-colors hover:text-[#0F172A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/30"
          >
            GitHub
          </a>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard"
            className="inline-flex h-9 shrink-0 items-center gap-2 rounded-[9px] bg-[#0F172A] px-3.5 text-[12px] font-semibold text-white shadow-[0_10px_24px_rgba(15,23,42,0.14)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#1E293B] hover:shadow-[0_14px_30px_rgba(15,23,42,0.2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/35"
          >
            <span className="hidden sm:inline">Launch Dashboard</span>
            <span className="sm:hidden">Dashboard</span>
            <ArrowRight className="size-3.5" />
          </Link>
          <button
            type="button"
            aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((current) => !current)}
            className="grid size-9 cursor-pointer place-items-center rounded-[9px] border border-[#E8EDF5] bg-white text-[#64748B] lg:hidden"
          >
            {mobileOpen ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>

        {mobileOpen ? (
          <div className="absolute left-5 right-5 top-[calc(100%+8px)] rounded-[12px] border border-[#E8EDF5] bg-white p-2 shadow-[0_20px_50px_rgba(15,23,42,0.14)] md:left-auto md:right-8 md:w-64">
            {navigation.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => scrollToSection(item.target)}
                className="flex w-full cursor-pointer rounded-[8px] px-3 py-2.5 text-left text-[12px] font-semibold text-[#475569] transition-colors hover:bg-[#F6F8FB] hover:text-[#0F172A]"
              >
                {item.label}
              </button>
            ))}
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer"
              className="flex rounded-[8px] px-3 py-2.5 text-[12px] font-semibold text-[#475569] transition-colors hover:bg-[#F6F8FB] hover:text-[#0F172A]"
            >
              GitHub
            </a>
          </div>
        ) : null}
      </nav>
    </header>
  )
}
