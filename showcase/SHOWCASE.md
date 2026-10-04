# SHOWCASE.md — marketing screenshot rules for web apps

Read this fully before capturing or composing anything. These rules override any skill defaults that conflict.

## Goal
Produce premium showcase images of this web app for a portfolio site, CV and LinkedIn.
Audience: recruiters and software engineers. They should read it as "serious, well-built product", not "AI-generated marketing".

## Output sizes
- `site/` 2400×1500 (16:10), primary set
- `og/` 1200×630, one image (frame 1)
- `social/` 1080×1350, optional, only if asked

## Capture (Playwright)
- Run the app locally. Viewport 1440×900, `deviceScaleFactor: 2`.
- Hide scrollbars (`::-webkit-scrollbar{display:none}`), disable cursor/hover states.
- Wait for network idle AND chart animations to finish (wait ~800ms after idle, or wait for a known final element).
- Capture **components, not pages**: use `locator.screenshot()` on the specific card/section for each frame.
- If a component is taller than the viewport, increase viewport height for that capture. Never crop through a component.
- Same theme, same data state across every capture.

## Composition rules
1. **One idea per frame.** One component (max two, overlapping for depth).
2. **Product ≥ 70% of the canvas.** Text never takes more than ~25% of canvas height.
3. **Never cut a component mid-element.** Crops happen at card boundaries or the canvas edge only, and an edge bleed must look deliberate (component clearly continues, key content fully visible).
4. **Scale up.** Components are shown at 1.2–2× their in-app size. Small text in the UI must be legible when the image is viewed at 50%.
5. **Floating panels, not browser windows**, by default. Card = the app's own card styling + 1px border + soft large shadow (e.g. `0 30px 80px -20px rgba(20,20,20,.18)`). Use a browser frame only for the full landing-page hero.
6. **Depth via overlap:** for two-component frames, the secondary card sits behind/offset by ~8–12% of canvas, slightly smaller.
7. Consistent margins across the set (e.g. 120px at 2400w). Consistent headline position across the set.

## Background
- A quiet tint of the app's own palette. For GridCast: base `#F5F4F0`, canvas `#ECEAE3` or a very subtle radial lift behind the component.
- No contrasting colour slabs, no decorative lines/waves/gradients-as-decoration, no grids unless they carry meaning.

## Type and copy
- Use the app's own font so frame and product feel like one thing.
- Headline: ≤ 8 words, ≤ 2 lines, 64–84px at 2400w, sentence case.
- No subheadline by default. Add one short line only if the headline can't stand alone.
- No eyebrow labels, no all-caps, no single accent-coloured word, no arrows.
- Copy is factual and engineer-readable. It must match what the app actually does (check the model type, metrics and data source in the UI before writing).

## GridCast frame plan (adjust after seeing captures)
1. **Hero** — landing hero section in a minimal browser frame. "Half-hourly demand forecasting for Great Britain."
2. **Forecast** — Overview → "Observed demand and the 48-hour forecast" card, whole card. "48 hours ahead, with an uncertainty band."
3. **Explainability** — AI Insights → "Why this number" card in front, "What the model leans on" card behind. "Every forecast, explained."
4. **Regional** — Grid Map card (full map visible) + Selected Region panel overlapping. "Regional demand, honestly labelled."
5. **Spread** — Forecasts → "Where the forecast is likely to land" card. "Where the next 48 hours land."

## References
- Study every image in `showcase/references/` before designing. Match their density, scale and restraint, not their colours.

## Process
1. Capture all components → `showcase/captures/`.
2. Build compositions as a single Next.js page (or HTML) in `showcase/`, one frame per section at exact output size.
3. Render each frame to PNG with Playwright → `showcase/out/site/`, `showcase/out/og/`.
4. Make a contact sheet of all frames. Look at it. Run the checklist. Fix and re-render. Minimum 2 review passes before showing me.

## Review checklist (every frame must pass)
- [ ] Product fills ≥ 70% of the canvas
- [ ] No component sliced mid-element; key content fully visible
- [ ] UI text legible at 50% zoom
- [ ] Headline ≤ 2 lines, same position as other frames
- [ ] Background is quiet; nothing decorative competes with the UI
- [ ] Copy is accurate to the app
- [ ] Set looks consistent as a contact sheet


## Reference-derived overrides
- Default: NO headline on site/ frames. Headlines only on og/ and social/.
- Canvas: flat #F2F2F2 (or the app's own off-white), window/panel at a fixed ~8% margin.
- Window chrome: thin 1px outline, small radius, no traffic lights except on corner-crop frames.
- Allowed treatments per frame (pick one):
  1. Full view: whole app window, calm, unedited.
  2. Focus: one card sharp and lifted; the rest of the page dimmed (~40% grey overlay) and blurred (~8px).
  3. Corner crop: top-left region at ~2x, bleeding off the right and bottom edges.
- Across a 5-frame set, use at least two different treatments.
