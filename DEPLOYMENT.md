# Deployment runbook

Two independent platforms deploy from this repository:

| Platform | Deploys | From | Trigger |
|---|---|---|---|
| **Vercel** | frontend (`/`, `/dashboard`) | repo root | **push to `main`** — confirmed: `vercel[bot]` production deployment and a `Vercel` commit status |
| **Render** | backend (`gridcast-api`) | `backend/` | push to `main` that changes `backend/`, through `.github/workflows/deploy-backend.yml` and the service's deploy hook (keep Render's Auto-Deploy off); also runnable by hand from the Actions tab |

Live URLs: `https://gridcast-ai-sooty.vercel.app` and `https://gridcast-api.onrender.com`.

**Pushing `main` always deploys the frontend.** Turning Render's Auto-Deploy off
does not prevent that — it only decouples the backend.

## GitHub Actions

### Render deploy hook

`deploy-backend.yml` POSTs to the Render deploy hook in the repository secret
`RENDER_DEPLOY_HOOK_URL`, and fails with a clear error if the secret is not set.

1. Render Dashboard → the `gridcast-api` service → **Settings** → **Deploy
   Hook** (under Build & Deploy). Copy the URL
   (`https://api.render.com/deploy/srv-…?key=…`). Treat it as a secret: anyone
   with it can trigger a deploy. Regenerate it there if it leaks.
2. While on that page, set **Auto-Deploy** to **Off**, or a backend push
   deploys twice.
3. GitHub → the repository → **Settings** → **Secrets and variables** →
   **Actions** → **New repository secret**. Name `RENDER_DEPLOY_HOOK_URL`,
   value the hook URL. Or from a terminal:
   `gh secret set RENDER_DEPLOY_HOOK_URL --repo HamidZ11/gridcast-ai` (it
   prompts for the value, which keeps it out of shell history).

### Keeping the backend warm

`keep-warm.yml` GETs `https://gridcast-api.onrender.com/health` every 10
minutes (90 s timeout) so the free instance never reaches its 15-minute
spin-down. Run it by hand from the Actions tab or with
`gh workflow run keep-warm.yml`. Two limits:

- GitHub runs schedules on a best-effort basis; under load a run can be
  delayed or skipped, so an occasional cold start is still possible. The
  status chrome handles that (`Waking backend`).
- An always-on free instance uses about 720-744 of the 750 free instance hours
  Render gives a workspace each month, leaving almost none for other free
  services in the same workspace.

## Before you start: two things must be true

### 1. `GRIDCAST_CORS_ORIGINS` must include the Vercel domain

**The live scenario simulator is broken right now, and this is why.** Verified in
a browser against production:

```
Access to fetch at 'https://gridcast-api.onrender.com/simulate'
from origin 'https://gridcast-ai-sooty.vercel.app'
has been blocked by CORS policy: Response to preflight request ...
```

`OPTIONS /simulate` from the Vercel origin returns **400 with no
`access-control-allow-origin` header**, while `http://localhost:3000` returns
200 — so the service is still running the default allow-list and has never had
`GRIDCAST_CORS_ORIGINS` set.

Set it on the Render service before or during the release:

```
GRIDCAST_CORS_ORIGINS = https://gridcast-ai-sooty.vercel.app,http://localhost:3000
```

Include any Vercel preview domains you want the simulator to work from.

### 2. Know your Render plan and Auto-Deploy setting

The observed **65-second cold start** is the signature of a single instance that
spins down, which is the free tier's behaviour. Confirm in the dashboard, because
it decides the next section.

## Downtime: what to expect, honestly

**A manual backend deploy does not guarantee zero downtime, and this runbook does
not claim it will.**

- Render performs zero-downtime rollouts (health-check gated) **only on instance
  types that run more than one instance**. A single-instance service — which the
  65s cold start indicates — is replaced, so there is a gap.
- A free service that has spun down is *already* returning nothing until the next
  request warms it, independently of deploys.
- `render.yaml` sets `healthCheckPath: /health`, but it names the service
  `gridcast-ai-backend` while the live one is `gridcast-api`, so the live
  service was probably not created from it and Render is not reading it.
  Check whether a health check is configured on the service.

**Verify the actual behaviour rather than assuming it**: during the backend
deploy, poll the API and record the gap.

```bash
while true; do
  printf '%s ' "$(date -u +%H:%M:%S)"
  curl -s -o /dev/null -w '%{http_code} %{time_total}s\n' --max-time 90 \
    https://gridcast-api.onrender.com/health
  sleep 5
done
```

**The frontend handles a backend outage gracefully.** Verified: with the API
unreachable the app shows `Backend unavailable` in the topbar and sidebar, every
figure reads `Unavailable`, and the forecast panel shows "No forecast to plot"
rather than an empty axis. An outage is visible and honest, not broken-looking.

## Caching (why the dashboard opens quickly, and what that costs)

Dashboard routes render per request. The data-source status in the topbar and
sidebar is read live, never from a cache, so it cannot say `Artifact data`
while the API is serving fallback. It streams in after the page: a sleeping
backend delays that label, not the page. The figures on each page still come
from Next's Data Cache.

| Fetch | Cached for | Why |
|---|---|---|
| `/forecast` `/history` `/metrics` `/model` `/feature-importance` `/explain` | **300 s** | frozen dataset + saved model; only changes on a backend redeploy |
| `/health` (About page) | **60 s** | backend health for pages that report it |
| status check: `/health` `/model` `/forecast` | **never**; 8 s timeout, 4 s on rechecks | the data-source chrome must follow reality |
| `POST /simulate` | never | depends on the request body |

Consequences to know about:

- **Figures don't wait on the backend** when they have a cache entry. The first
  request after an entry expires is served stale and refetches in the
  background; a request with no entry at all waits on the backend.
- **The status label reads `Checking data`** until the backend answers. If it
  has not answered within 8 s, which is what a Render cold start looks like
  (~45-65 s), it reads `Waking backend` and the browser rechecks through
  `/api/status` every 5 s for up to 90 s. It settles on the real state as soon
  as the backend answers, and says `Backend unavailable` only if it is still
  down after 90 s. The page keeps rendering from cache throughout.
- **A backend redeploy shows up in the status immediately** and in the figures
  within 5 minutes.
- **If the backend is down**, figures keep serving the last good entry until it
  lapses, then fall back to `Unavailable`. The status says
  `Backend unavailable` straight away if the API refuses the connection, or
  after the 90 s recheck window if it hangs.
- **`next build` still fetches each page's figures** while it works out that
  the dashboard routes are dynamic, which primes the Data Cache. Prefer
  building while the backend is up.
- `/dashboard/scenarios` POSTs the default scenario on its initial render. It
  streams a skeleton first, but its data still waits on the backend, including
  cold starts.

## Sequence

### Step 0 — push the backup refs first

So the pre-release commit exists off this machine before anything changes:

```bash
git push origin backup/pre-redesign-main            # tag  -> c8cfda9
git push origin backup/pre-redesign-main-branch     # branch -> c8cfda9
```

### Step 1 — decide the order

> With `deploy-backend.yml` in place (and Auto-Deploy off), any push that
> changes `backend/` also deploys the backend. To sequence a release, push the
> frontend change first and the backend change separately, or deploy the
> backend by running the workflow from the Actions tab when ready.

**If Render Auto-Deploy is OFF (recommended for the first release):**

1. Push `main`. Vercel rebuilds the frontend; the backend is untouched.
2. The new frontend then runs against the **current** backend. This is a verified,
   supported state: overview, forecasts, metrics, grid map and scenarios all work;
   `/explain` returns 503 and Model Insights shows its honest empty state;
   feature importance says it is using native coefficients.
3. Deploy the backend manually from the Render dashboard when you are ready.
4. Expect a gap while the instance is replaced — see above.

**If Render Auto-Deploy is ON:** both deploy from the one push and you cannot
sequence them. The backend build takes longer than the frontend, so there will be
a window where the new frontend talks to a restarting API and shows
`Backend unavailable`. That is acceptable but not controllable.

### Step 2 — push

```bash
git push origin main
```

### Step 3 — post-deployment checks

Run these against production and expect the stated results. The first backend
call may take ~60s if the instance was asleep.

```bash
API=https://gridcast-api.onrender.com
WEB=https://gridcast-ai-sooty.vercel.app

# --- backend health and provenance -------------------------------------
curl -s -o /dev/null -w 'health %{http_code} in %{time_total}s\n' --max-time 120 $API/health

for e in /model /metrics /forecast /history /feature-importance; do
  printf '%-22s ' "$e"
  curl -s --max-time 60 "$API$e" | python3 -c \
    "import sys,json;d=json.load(sys.stdin);print('data_source =', d.get('data_source'))"
done
# expect: artifact on all five

# --- explanations are populated (the point of shipping shap) ------------
curl -s --max-time 60 "$API/explain" | python3 -c "
import sys,json;d=json.load(sys.stdin)
t=d['base_value']+sum(f['impact'] for f in d['features'])
print('  method   =', d['method'])
print('  pred     =', d['prediction'], 'GW   base =', d['base_value'])
print('  additive =', round(t,4), '(delta', round(abs(t-d['prediction']),4), ')')
print('  top      =', d['features'][0]['name'], d['features'][0]['impact'])"
# expect: 200, method LinearExplainer, NOT 503 "Explainability is disabled"

curl -s --max-time 60 "$API/feature-importance" | python3 -c \
  "import sys,json;print('  method =', json.load(sys.stdin)['method'])"
# expect: mean_absolute_shap   (not native_importance)

# --- CORS for the browser-side simulator --------------------------------
curl -s -i -X OPTIONS "$API/simulate" \
  -H "Origin: $WEB" -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type" --max-time 60 \
  | grep -i "access-control-allow-origin"
# expect: access-control-allow-origin: https://gridcast-ai-sooty.vercel.app
# no header => the simulator will silently fail in the browser

# --- frontend ------------------------------------------------------------
curl -s -o /dev/null -w 'landing %{http_code}\n' --max-time 60 $WEB/
curl -s -o /dev/null -w 'dashboard %{http_code}\n' --max-time 60 $WEB/dashboard
curl -s --max-time 60 $WEB/ | grep -q "electricity demand moves" \
  && echo "landing: NEW design live" || echo "landing: still the old page"
```

**In a browser, on the live site:**

| Check | Expected |
|---|---|
| `/` | new landing page; hero chart responds to hover and to ← → |
| `/dashboard` topbar | `Artifact data` with a green dot — never "Live" |
| `/dashboard/model-insights` | "Why this number" shows real figures, not `--` |
| `/dashboard/scenarios` | move Temperature to +8 °C → peak moves 20.7 → 21.1 GW |
| `/dashboard/grid-map` | all five layers switch; each shows Derived / Heuristic / Illustrative |
| Scenario with the API down | visible error notice **and** a `Failed` chip — never silent |

### Step 4 — if the backend build fails

The frontend is already live and degrades honestly, so there is no emergency.
Either fix forward, or roll the backend back to the previous Render deploy from
its dashboard — the frontend does not need to change, because it is
forward- and backward-compatible with both API versions (verified).

## Rollback

History-preserving only. See [DESIGN.md](DESIGN.md#rolling-back-after-release).

```bash
git revert -m 1 <merge-sha>
git push origin main
```

Never `reset --hard` + force-push `main`: it rewrites published history and can
strand Vercel and Render on a commit that no longer exists.
