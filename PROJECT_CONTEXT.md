# GridCast AI - Project Context

GridCast AI is a full-stack machine learning portfolio project: half-hourly
electricity demand forecasting for Great Britain, with a FastAPI backend and a
Next.js analytics dashboard.

## Current State

**Data.** NESO Historic Demand Data 2024, processed into 17,232 half-hourly rows
(8 Jan to 31 Dec 2024) with 11 engineered calendar, lag and rolling-demand
features. There is no live feed; everything is served from this frozen record.

**Model.** Linear Regression and Random Forest are trained on the same
chronological split (13,785 train / 3,447 held-out rows). Training keeps the
lower RMSE, so Linear Regression is the saved artifact (492.03 vs 492.18 MW;
Random Forest is slightly better on MAE and MAPE). Held-out MAPE is 1.36% one
step ahead; the 48-hour forecast is recursive and not separately backtested.
SHAP explanations use LinearExplainer. XGBoost is supported by the training
code but has not been trained.

**API.** FastAPI serves forecasts, history, metrics, model metadata, feature
importance, SHAP explanations and scenario simulation from
`backend/models/model.pkl` and `model_metadata.json`. If an artifact cannot be
loaded, endpoints return fallback responses marked `data_source: "fallback"`;
model-describing fallbacks still describe the deployed Linear Regression model.

**Frontend.** A landing-page case study plus the dashboard: Overview,
Forecasts, AI Insights, Grid Map, Scenarios, Schedules and About. The chrome
reports `Artifact data`, `Fallback data` or `Backend unavailable` from a live
check, and fallback values are never shown as results. Illustrative and
derived figures are labelled as such (see DESIGN.md).

**Deployment.** Frontend on Vercel, backend on Render; see DEPLOYMENT.md.

**Showcase.** `showcase/` generates the portfolio screenshots: `npm run capture`
against the running app, then `npm run render` (rules in `showcase/SHOWCASE.md`).

## Known Gaps

- Weather features are not included.
- Prediction intervals are approximated from validation RMSE, not calibrated
  per horizon.
- Regional figures split the national forecast by fixed shares; the model is
  national only.

## Design Direction

A premium light-theme analytics product, honest about where every number comes
from. DESIGN.md holds the tokens and the data honesty rules.
