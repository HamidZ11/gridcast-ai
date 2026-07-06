import type { Metadata } from "next"

import "./globals.css"

export const metadata: Metadata = {
  title: "GridCast AI",
  description: "Short-term electricity demand forecasting for the UK National Grid",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-[#F6F8FB] font-sans text-[#0F172A]">
        {children}
      </body>
    </html>
  )
}
