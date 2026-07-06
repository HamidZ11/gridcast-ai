# GridCast AI

A full-stack machine learning platform for short-term UK electricity demand forecasting.

## Overview

GridCast AI is a portfolio-grade analytics platform for forecasting electricity demand across the next demand cycle. The project combines:

- A polished Next.js frontend dashboard
- A FastAPI backend service
- A modular machine learning forecasting pipeline
- Model insights and explainability views
- Future integration with real UK electricity demand and weather data

The goal is to demonstrate practical full-stack ML engineering: product-quality UI, clean API contracts, model architecture, and a realistic path from data ingestion to served forecasts.

## Current Status

- Frontend MVP complete with Overview, Forecast Analytics, and Model Insights pages
- Backend architecture complete
- `/forecast`, `/history`, `/metrics`, and `/model` now read from processed NESO data and saved model artifacts
- Real historical demand ingestion pipeline complete
- Baseline training and first-pass 48-hour inference run from the processed demand dataset
- Weather and calendar data are still mocked placeholders

The frontend consumes the stable FastAPI contracts. The backend now serves predictions from the selected saved baseline model, while retaining mock fallbacks when local artifacts are unavailable. This is an architectural inference milestone, not a claim of production forecast quality.

## Features

### Frontend

- Demand forecast dashboard
- KPI cards
- Forecast analytics
- Model insights
- Feature importance
- Prediction explainability
- Confidence metrics

### Backend

- FastAPI service
- Typed Pydantic schemas
- Model-backed forecast, history, metrics, and metadata endpoints with mock fallback
- Modular ML pipeline structure
- Swappable model interface
- Configuration management
- Historical demand CSV ingestion
- Data profiling and validation
- Feature-engineered training dataset export

## Tech Stack

### Frontend

- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui
- Recharts

### Backend

- FastAPI
- Python
- pandas
- NumPy
- scikit-learn
- XGBoost
- SHAP

## Project Structure

```text
gridcast-ai/
├── src/
│   ├── app/
│   │   ├── page.tsx
│   │   ├── forecast/
│   │   └── model-insights/
│   ├── components/
│   └── data/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── models/
│   │   ├── services/
│   │   ├── schemas/
│   │   └── main.py
│   ├── ml/
│   │   ├── ingestion/
│   │   ├── preprocessing/
│   │   ├── features/
│   │   ├── validation/
│   │   ├── training/
│   │   ├── inference/
│   │   ├── evaluation/
│   │   └── explainability/
│   ├── data/
│   │   ├── raw/
│   │   └── processed/
│   ├── notebooks/
│   └── tests/
├── public/
├── README.md
├── PROJECT_CONTEXT.md
└── ROADMAP.md
```

## Running Locally

### Frontend

```bash
npm install
npm run dev
```

The frontend is expected to run on `http://localhost:3001` during local GridCast AI development. Next.js may use another available port if `3001` is occupied.

Create a local environment file if you need to override the backend URL:

```bash
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8001
```

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
```

The backend API will be available at `http://127.0.0.1:8001`.

## API Endpoints

Current API endpoints:

- `GET /health`
- `GET /forecast` - 96 model-generated half-hourly points
- `POST /simulate` - model-backed 48-hour what-if scenario forecast
- `GET /history` - recent processed NESO observations
- `GET /metrics` - saved validation metrics
- `GET /feature-importance` - active estimator importance values
- `GET /explain` - cached local SHAP explanation for a forecast point
- `GET /model` - saved model metadata, comparison metrics, features, and limitations

Model-backed payloads identify themselves with `data_source: "artifact"`; fallback payloads use `data_source: "fallback"`. This prevents the frontend from displaying fallback model names or metrics as if they were production artifacts.

## Dataset

Phase 7A selected the preferred UK demand source for future GridCast AI model work:

- Source: National Energy System Operator (NESO) Open Data Portal
- Dataset title: `Historic Demand Data`
- Portal URL: `https://www.neso.energy/data-portal/historic-demand-data`
- Metadata API: `https://api.neso.energy/api/3/action/package_show?id=historic-demand-data`
- Selected raw file for discovery: `Historic Demand Data 2024`
- Download URL: `https://api.neso.energy/dataset/8f2fe0af-871c-488d-8bad-960426f24601/resource/f6d02c0f-957b-48cb-82ee-09003f2ba759/download/demanddata_2024.csv`
- License: NESO Open Data Licence
- License URL: `https://www.neso.energy/data-portal/ngeso-open-licence`
- Update cadence: populated 21 days in arrears, with possible retrospective corrections
- Raw file location: `backend/data/raw/neso_historic_demand_2024.csv`
- Initial forecasting target: `ND`, renamed internally to `demand`

The selected NESO file is a static annual CSV with half-hourly settlement-period demand data. It includes `SETTLEMENT_DATE`, `SETTLEMENT_PERIOD`, `ND` (National Demand), `TSD` (Transmission System Demand), and `ENGLAND_WALES_DEMAND`.

Timestamp construction:

- `SETTLEMENT_PERIOD = 1` maps to `00:00`
- `SETTLEMENT_PERIOD = 2` maps to `00:30`
- `SETTLEMENT_PERIOD = 48` maps to `23:30`
- The model-ready dataset is reindexed onto a continuous 30-minute grid.
- Clock-change settlement periods outside the model-ready `1-48` convention are not written to the raw file; the processed table is normalized for regular ML features.

Profile the selected raw dataset:

```bash
cd backend
source .venv/bin/activate
python -m ml.ingestion.profile_dataset
```

The profiler writes:

- `backend/data/processed/profile.json`

Processed training output:

- Output path: `backend/data/processed/training_dataset.csv`
- Target column: `demand`
- Retained demand context columns: `TSD`, `ENGLAND_WALES_DEMAND`
- Half-hourly lags: `demand_lag_1`, `demand_lag_48`, `demand_lag_336`
- Half-hourly rolling features: `demand_rolling_3`, `demand_rolling_48`, `demand_rolling_336`

Generate the processed dataset:

```bash
cd backend
source .venv/bin/activate
python -m ml.pipeline
```

The baseline training workflow excludes retained demand context columns from model features to avoid target leakage.

### Baseline Training

Phase 7C trains baseline models on the processed NESO dataset:

```bash
cd backend
source .venv/bin/activate
python -m ml.training.train
```

Training input:

- `backend/data/processed/training_dataset.csv`

Target:

- `demand` (mapped from NESO `ND`)

Feature columns:

- `hour`
- `day`
- `month`
- `day_of_week`
- `is_weekend`
- `demand_lag_1`
- `demand_lag_48`
- `demand_lag_336`
- `demand_rolling_3`
- `demand_rolling_48`
- `demand_rolling_336`

Excluded from training features:

- `timestamp`
- `demand`
- `TSD`
- `ENGLAND_WALES_DEMAND`
- non-numeric columns
- leakage or target-derived columns

Models compared:

- Linear Regression
- Random Forest Regressor
- XGBoost Regressor, if the local runtime can load XGBoost dependencies

Metrics:

- MAE: average absolute forecast error in MW
- RMSE: root mean squared forecast error in MW, more sensitive to large misses
- MAPE: percentage error relative to actual demand
- R²: variance explained by the model

Artifacts:

- `backend/models/model.pkl`
- `backend/models/model_metadata.json`

Current limitations:

- Weather features are not included yet.
- Calendar features are basic engineered time fields only.
- Training currently uses a simple chronological 80/20 split, not rolling-origin backtesting.

### Model Inference

After generating the processed dataset and training the baselines:

```bash
cd backend
source .venv/bin/activate
python -m ml.pipeline
python -m ml.training.train
uvicorn app.main:app --reload --port 8001
```

The API loads `backend/models/model.pkl`, its metadata, and the latest processed feature row. It creates 96 half-hourly timestamps, updates calendar fields, predicts demand in MW, and returns GW values through the existing `/forecast` contract.

Forecast inference begins 30 minutes after the latest dataset observation and
runs recursively for 96 steps. Every prediction updates the in-memory lag and
rolling-demand windows used by the next step. Weather is not included, and the
90% confidence interval remains an RMSE-based approximation rather than a
horizon-specific calibration.

Feature importance now comes from normalized mean absolute SHAP values. Local
forecast explanations use `LinearExplainer` for linear models, `TreeExplainer`
for tree models, and a permutation fallback for other compatible estimators.
Native coefficients or estimator importances remain the fallback if global
SHAP calculation is unavailable. Explanations are cached against the active
model artifact signature.

Previous fallback work used the Open Power System Data hourly time-series package:

- Source: Open Power System Data, `time_series_60min_singleindex.csv`
- Package version: `2020-10-06`
- DOI: `https://doi.org/10.25832/time_series/2020-10-06`
- Homepage: `https://data.open-power-system-data.org/time_series/2020-10-06`
- Demand column: `GB_UKM_load_actual_entsoe_transparency`
- Timestamp column: `utc_timestamp`

OPSD remains useful as a fallback/reference dataset, but NESO Historic Demand Data is now the preferred source for UK demand model development.

The OPSD datapackage metadata available during implementation did not declare a redistribution license in `datapackage.json`; verify licensing before redistributing the raw file. The repository ignores raw and processed data artifacts so large datasets are not committed.

### Download

```bash
curl -L -o backend/data/raw/opsd_time_series_60min_singleindex.csv \
  https://data.open-power-system-data.org/time_series/2020-10-06/time_series_60min_singleindex.csv
```

Expected locations:

- Raw source CSV: `backend/data/raw/opsd_time_series_60min_singleindex.csv`
- Profile output: `backend/data/processed/profile.json`
- Training dataset output: `backend/data/processed/training_dataset.csv`

### Data Pipeline

Run the ingestion and feature pipeline:

```bash
cd backend
source .venv/bin/activate
python -m ml.pipeline
```

Pipeline order:

1. Load the raw OPSD CSV
2. Validate required source columns
3. Parse UTC timestamps
4. Sort chronologically
5. Remove duplicate timestamps
6. Fill missing demand values conservatively
7. Generate a profile report
8. Validate chronology, nulls, duplicates, intervals, and invalid demand values
9. Add mocked weather and calendar placeholders
10. Generate time features, lag features, and rolling averages
11. Save `backend/data/processed/training_dataset.csv`

## Machine Learning Plan

Planned pipeline:

1. Load historical electricity demand data
2. Clean timestamps and missing values
3. Merge weather data
4. Generate time features
5. Generate lag features
6. Generate rolling averages
7. Train baseline models
8. Compare Linear Regression, Random Forest, and XGBoost
9. Evaluate using MAE, RMSE, MAPE, and R²
10. Serve forecasts through FastAPI
11. Serve cached SHAP feature importance and local forecast explanations

## Portfolio Purpose

GridCast AI is designed to show practical full-stack machine learning engineering, not just notebook-based modelling. It demonstrates how a forecasting product can be structured across frontend experience, backend API contracts, data pipelines, model interfaces, evaluation, and explainability.
