// Captures every GridCast surface the showcase frames are built from.
//
//   node capture.mjs [baseUrl]        default http://localhost:3001
//
// Three kinds of capture per page, all at 1440x900 CSS and deviceScaleFactor 2:
//   <page>.viewport.png     what the window shows at a fixed scroll position,
//                           untouched; used whole by full-view frames.
//   <page>.backdrop.png     the same view with this page's components hidden.
//                           Focus frames dim and blur it behind the lifted cards;
//                           without the gap, a blurred twin of each lifted card
//                           shows beside the sharp one.
//   <page>.<component>.png  one Panel, located by its own heading, with every
//                           ancestor background removed so the card's rounded
//                           corners come out transparent.
//
// Motion is left at the browser default. A reduced-motion bug once cost the
// AI Insights feature chart 5 of its 11 axis labels (fixed in globals.css);
// assertAllAxisLabels fails the capture if anything like it comes back.
// captures/manifest.json records each component's box inside its viewport
// capture so the composer can lift a card from where it actually sits.

import { chromium } from "playwright"
import { mkdir, writeFile } from "node:fs/promises"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const BASE_URL = process.argv[2] ?? "http://localhost:3001"
const OUT = join(dirname(fileURLToPath(import.meta.url)), "captures")
const VIEWPORT = { width: 1440, height: 900 }
const SETTLE_MS = 1000

// Scrollbars, cursor, caret and hover/transition states never belong in a capture.
const CAPTURE_CSS = `
  ::-webkit-scrollbar { display: none !important; }
  * { scrollbar-width: none !important; cursor: none !important; caret-color: transparent !important;
      transition: none !important; animation: none !important; }
`

// A Panel is the nearest <section>/<aside> around its <h2>. Matching the heading
// exactly keeps a locator from drifting onto a neighbouring card.
const panelByHeading = (page, name) =>
  page.getByRole("heading", { level: 2, name, exact: true }).locator("xpath=ancestor::*[self::section or self::aside][1]")

const panelByEyebrow = (page, text) =>
  page.getByText(text, { exact: true }).locator("xpath=ancestor::*[self::section or self::aside][1]")

const PAGES = [
  {
    id: "landing",
    path: "/",
    scrollY: 0,
    components: {
      hero: (page) => page.locator("main > section").first(),
    },
  },
  {
    id: "overview",
    path: "/dashboard",
    scrollY: "max",
    components: {
      forecast: (page) => panelByHeading(page, "Observed demand and the 48-hour forecast"),
    },
  },
  {
    id: "insights",
    path: "/dashboard/model-insights",
    scrollY: 700,
    components: {
      why: (page) => panelByHeading(page, "Why this number"),
      leans: (page) => panelByHeading(page, "What the model leans on"),
    },
  },
  {
    id: "gridmap",
    path: "/dashboard/grid-map",
    // Shown as a full view. At 0 the map card's bottom edge (910) falls below the
    // 900px fold; 15 brings it in while the page eyebrow (64) stays clear of the
    // 48px sticky top bar and the ranking card (922) stays below the fold.
    scrollY: 15,
    components: {
      map: (page) => panelByHeading(page, "Great Britain demand map"),
      region: (page) => panelByEyebrow(page, "Selected region"),
    },
  },
  {
    id: "forecast",
    path: "/dashboard/forecast",
    scrollY: 0,
    components: {
      spread: (page) => panelByHeading(page, "Where the forecast is likely to land"),
    },
  },
]

// Recharts drops category labels it thinks would collide. A capture must show
// every row the card's own data table lists. Numeric axes are skipped.
async function assertAllAxisLabels(component, label) {
  const ticks = await component.locator(".recharts-yAxis .recharts-cartesian-axis-tick").allTextContents()
  const isCategory = ticks.some((text) => /[a-z]/i.test(text))
  const rows = await component.locator("details table tbody tr").count()
  if (isCategory && rows > 0 && ticks.length !== rows) {
    throw new Error(`${label}: ${ticks.length} axis labels rendered for ${rows} data rows`)
  }
}

async function settle(page) {
  await page.waitForLoadState("networkidle")
  await page.addStyleTag({ content: CAPTURE_CSS })
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(SETTLE_MS)
}

async function capturePage(context, spec) {
  const page = await context.newPage()
  await page.setViewportSize(VIEWPORT)
  await page.goto(BASE_URL + spec.path, { waitUntil: "networkidle" })
  await settle(page)

  // 1. The window view at the configured scroll position.
  const scrollY = await page.evaluate((target) => {
    const max = document.documentElement.scrollHeight - window.innerHeight
    const y = target === "max" ? max : Math.min(target, max)
    window.scrollTo(0, y)
    return window.scrollY
  }, spec.scrollY)
  await page.waitForTimeout(300)
  await page.screenshot({ path: join(OUT, `${spec.id}.viewport.png`) })

  const boxes = {}
  for (const [name, locate] of Object.entries(spec.components)) {
    const box = await locate(page).boundingBox()
    if (!box) throw new Error(`${spec.id}.${name}: component not found`)
    boxes[name] = { x: box.x, y: box.y, width: box.width, height: box.height }
    await assertAllAxisLabels(locate(page), `${spec.id}.${name}`)
  }

  // 1b. The backdrop: same view, this page's components lifted out.
  //     Tagged rather than re-located on restore: a hidden heading no longer
  //     matches getByRole.
  for (const locate of Object.values(spec.components)) {
    await locate(page).evaluate((el) => el.setAttribute("data-showcase-lifted", ""))
  }
  await page.addStyleTag({ content: "[data-showcase-lifted] { visibility: hidden !important; }" })
  await page.screenshot({ path: join(OUT, `${spec.id}.backdrop.png`) })
  await page.evaluate(() => document.querySelectorAll("[data-showcase-lifted]").forEach((el) => el.removeAttribute("data-showcase-lifted")))

  // 2. Components. Lay the whole page out at once so nothing scrolls: sticky
  //    chrome then stays at the top of the document and cannot overlap a card,
  //    and a card taller than 900px is never cropped.
  await page.evaluate(() => window.scrollTo(0, 0))
  const fullHeight = await page.evaluate(() => document.documentElement.scrollHeight)
  await page.setViewportSize({ width: VIEWPORT.width, height: Math.max(VIEWPORT.height, fullHeight) })
  await page.waitForTimeout(600)

  const components = {}
  for (const [name, locate] of Object.entries(spec.components)) {
    const target = locate(page)
    await target.waitFor({ state: "visible" })
    // Clear every ancestor background; with omitBackground the corners outside
    // the card's radius are then transparent instead of page-coloured.
    const restore = await target.evaluate((el) => {
      const saved = []
      for (let node = el.parentElement; node; node = node.parentElement) {
        saved.push([node, node.style.background])
        node.style.background = "transparent"
      }
      window.__restoreBackgrounds = () => saved.forEach(([node, value]) => (node.style.background = value))
      return true
    })
    const file = `${spec.id}.${name}.png`
    await target.screenshot({ path: join(OUT, file), omitBackground: true })
    await page.evaluate(() => window.__restoreBackgrounds())
    const box = await target.boundingBox()
    components[name] = {
      file,
      width: Math.round(box.width),
      height: Math.round(box.height),
      // position inside <page>.viewport.png, in CSS px
      inViewport: boxes[name],
    }
    if (!restore) throw new Error("background reset failed")
  }

  await page.close()
  return { viewport: `${spec.id}.viewport.png`, backdrop: `${spec.id}.backdrop.png`, scrollY, components }
}

await mkdir(OUT, { recursive: true })
const browser = await chromium.launch()
const context = await browser.newContext({
  viewport: VIEWPORT,
  deviceScaleFactor: 2,
  colorScheme: "light",
})

const manifest = { baseUrl: BASE_URL, viewport: VIEWPORT, deviceScaleFactor: 2, capturedAt: new Date().toISOString(), pages: {} }
for (const spec of PAGES) {
  manifest.pages[spec.id] = await capturePage(context, spec)
  console.log(`captured ${spec.id}`, Object.keys(spec.components).join(", "))
}
await browser.close()

await writeFile(join(OUT, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n")
console.log(`manifest -> ${join(OUT, "manifest.json")}`)
