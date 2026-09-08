import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"

import "./globals.css"

/*
 * Loaded once for the whole product. globals.css maps Tailwind's `font-sans`
 * and `font-mono` onto these two variables, so every surface - landing page and
 * application alike - resolves to the same pair.
 */
const sans = Geist({ subsets: ["latin"], display: "swap", variable: "--gc-font-sans" })
const mono = Geist_Mono({ subsets: ["latin"], display: "swap", variable: "--gc-font-mono" })

export const metadata: Metadata = {
  title: "GridCast AI",
  description: "Short-term electricity demand forecasting for Great Britain",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable} h-full antialiased`}>
      <body className="min-h-full bg-[var(--gc-paper)] font-sans text-[var(--gc-ink)]">
        {children}
      </body>
    </html>
  )
}
