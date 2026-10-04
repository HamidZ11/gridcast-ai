// Renders generator.html to PNGs and builds the contact sheet.
//
//   node render.mjs            frames -> out/<id>.png, sheet -> out/contact-sheet.png
//   node render.mjs --serve    just serve the generator for a look in a browser
//
// The folder is served over http (not file://) so the generator can fetch the
// capture manifest.

import { chromium } from "playwright"
import { createServer } from "node:http"
import { mkdir, readFile } from "node:fs/promises"
import { dirname, extname, join, normalize } from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = dirname(fileURLToPath(import.meta.url))
const OUT = join(ROOT, "out")
const TYPES = { ".html": "text/html", ".json": "application/json", ".png": "image/png", ".woff2": "font/woff2", ".js": "text/javascript" }

function serve() {
  const server = createServer(async (req, res) => {
    const path = normalize(decodeURIComponent(new URL(req.url, "http://x").pathname)).replace(/^(\.\.[/\\])+/, "")
    try {
      const body = await readFile(join(ROOT, path === "/" ? "generator.html" : path))
      res.writeHead(200, { "content-type": TYPES[extname(path)] ?? "application/octet-stream", "cache-control": "no-store" })
      res.end(body)
    } catch {
      res.writeHead(404).end()
    }
  })
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve(server)))
}

const server = await serve()
const base = `http://127.0.0.1:${server.address().port}`

if (process.argv.includes("--serve")) {
  console.log(`generator: ${base}/generator.html   (fit to screen: ${base}/generator.html?preview)`)
} else {
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 2600, height: 1600 }, deviceScaleFactor: 1 })
  await page.goto(`${base}/generator.html`)
  await page.waitForFunction(() => document.body.dataset.ready === "1", null, { timeout: 30000 })

  const frames = await page.$$eval("[data-frame]", (nodes) =>
    nodes.map((node) => {
      const frame = node.getBoundingClientRect()
      const area = (r) => Math.max(0, Math.min(r.right, frame.right) - Math.max(r.left, frame.left)) * Math.max(0, Math.min(r.bottom, frame.bottom) - Math.max(r.top, frame.top))
      // Lifted cards always sit inside the window, so the window is the product area.
      const windowRect = node.querySelector(".window").getBoundingClientRect()
      const strayCards = [...node.querySelectorAll(".card")]
        .map((n) => n.getBoundingClientRect())
        .filter((r) => r.left < windowRect.left || r.top < windowRect.top || r.right > windowRect.right || r.bottom > windowRect.bottom).length
      const headline = node.querySelector(".headline")?.getBoundingClientRect()
      return {
        id: node.dataset.frame,
        width: frame.width,
        height: frame.height,
        strayCards,
        productShare: area(windowRect) / (frame.width * frame.height),
        textShare: headline ? (headline.bottom - frame.top) / frame.height : 0,
      }
    })
  )

  for (const frame of frames) {
    const file = join(OUT, `${frame.id}.png`)
    await mkdir(dirname(file), { recursive: true })
    await page.locator(`[data-frame="${frame.id}"]`).screenshot({ path: file })
    console.log(
      `${frame.id.padEnd(24)} ${frame.width}x${frame.height}  product ${(frame.productShare * 100).toFixed(1)}%` +
        (frame.textShare ? `  text to ${(frame.textShare * 100).toFixed(1)}% of height` : "") +
        (frame.strayCards ? `  WARNING: ${frame.strayCards} card(s) outside the window` : "")
    )
  }

  // Contact sheet: every frame at the same width, in order, labelled.
  const tiles = frames
    .map(
      (f) => `<figure><img src="${base}/out/${f.id}.png?${Date.now()}"><figcaption>${f.id} · ${f.width}×${f.height}</figcaption></figure>`
    )
    .join("")
  await page.setViewportSize({ width: 2400, height: 1000 })
  await page.setContent(`<!doctype html><html><head><style>
      @font-face { font-family: Geist; src: url(${base}/assets/fonts/Geist-Latin.woff2) format("woff2"); font-weight: 100 900; }
      body { margin: 0; padding: 64px; background: #ffffff; font-family: Geist, sans-serif; }
      .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 56px 48px; align-items: start; }
      figure { margin: 0; }
      img { display: block; width: 100%; outline: 1px solid #e4e2dc; }
      figcaption { margin-top: 14px; font-size: 22px; color: #73767d; }
    </style></head><body><div class="grid">${tiles}</div></body></html>`)
  await page.waitForFunction(() => [...document.images].every((i) => i.complete && i.naturalWidth > 0))
  await page.screenshot({ path: join(OUT, "contact-sheet.png"), fullPage: true })
  console.log(`contact sheet -> ${join(OUT, "contact-sheet.png")}`)

  await browser.close()
  server.close()
}
