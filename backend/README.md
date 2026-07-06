# GridCast AI Backend

This folder contains the backend and machine learning architecture for GridCast AI.

Current status: the NESO ingestion pipeline, baseline model training, saved artifacts, and recursive model inference API are implemented.

## Purpose

The backend provides forecast, recent historical demand, saved model-performance, feature-importance, and model-metadata APIs for the existing Next.js dashboard. Stable mock responses remain available as graceful fallbacks when model artifacts or processed data are missing.

## Folder Structure

```text
backend/
├── app/
│   ├── api/          # FastAPI route definitions
│   ├── core/         # Configuration and shared settings
│   ├── models/       # Swappable model interfaces and adapters
│   ├── services/     # API service layer and mock responses
│   ├── schemas/      # Pydantic request/response models
│   └── main.py       # FastAPI app entrypoint
├── ml/
│   ├── preprocessing/    # Data loading, cleaning, feature engineering
│   ├── training/         # Train/test split, training orchestration, persistence
│   ├── inference/        # Model loading and prediction helpers
│   ├── evaluation/       # MAE, RMSE, MAPE, and future diagnostics
│   └── explainability/   # SHAP and prediction explanation utilities
├── data/
│   ├── raw/
│   ├── processed/
│   └── external/
├── notebooks/
├── tests/
└── requirements.txt
```

## Planned ML Workflow

```text
Load data
↓
Clean missing values
↓
Generate lag features
↓
Generate rolling averages
↓
Generate time features
↓
Merge weather data
↓
Train/test split
↓
Model training
↓
Evaluation
↓
Save model
↓
Serve forecasts through FastAPI
```

The model interface in `app/models/base.py` allows Linear Regression, Random Forest, and XGBoost implementations to be swapped without changing API route logic.

## API Endpoints

Current endpoints:

- `GET /health`
- `GET /forecast` - 96 half-hourly predictions from the saved model
- `POST /simulate` - 48-hour model-backed forecast under supplied scenario assumptions
- `GET /history` - latest processed NESO demand observations
- `GET /metrics` - validation metrics from saved model metadata
- `GET /feature-importance` - normalized active-model coefficients or estimator importances
- `GET /explain` - cached local SHAP explanation for a forecast point
- `GET /model` - saved model identity, training metadata, comparison metrics, features, and limitations

Model-backed responses include `data_source: "artifact"`. Graceful fallback responses use `data_source: "fallback"` so clients can avoid presenting mock values as production results. `/model` also exposes `all_model_metrics`, train/test row counts, the error unit used by saved comparison metrics, the feature schema, and documented limitations.

## Phase 7A Dataset Discovery

Selected dataset:

- Source: National Energy System Operator (NESO) Open Data Portal
- Dataset title: `Historic Demand Data`
- Portal URL: `https://www.neso.energy/data-portal/historic-demand-data`
- Metadata API: `https://api.neso.energy/api/3/action/package_show?id=historic-demand-data`
- Selected raw file: `Historic Demand Data 2024`
- Download URL: `https://api.neso.energy/dataset/8f2fe0af-871c-488d-8bad-960426f24601/resource/f6d02c0f-957b-48cb-82ee-09003f2ba759/download/demanddata_2024.csv`
- License: NESO Open Data Licence
- License URL: `https://www.neso.energy/data-portal/ngeso-open-licence`
- Update cadence: populated 21 days in arrears, with possible retrospective corrections
- Raw file location: `backend/data/raw/neso_historic_demand_2024.csv`
- Initial target column: `ND`, renamed internally to `demand`

The selected CSV contains half-hourly settlement-period demand data. The primary timestamp is built from `SETTLEMENT_DATE + SETTLEMENT_PERIOD`. `ND` is the initial forecasting target. `TSD` and `ENGLAND_WALES_DEMAND` are retained as contextual demand columns but are not the target.

Timestamp construction:

- Settlement period `1` = `00:00`
- Settlement period `2` = `00:30`
- Settlement period `48` = `23:30`
- The processed table is normalized to a continuous 30-minute grid for ML.

Download command:

```bash
curl -L -o backend/data/raw/neso_historic_demand_2024.csv \
  https://api.neso.energy/dataset/8f2fe0af-871c-488d-8bad-960426f24601/resource/f6d02c0f-957b-48cb-82ee-09003f2ba759/download/demanddata_2024.csv
```

Profile command:

```bash
cd backend
source .venv/bin/activate
python -m ml.ingestion.profile_dataset
```

The profiler writes `backend/data/processed/profile.json`.

Generate the processed training dataset:

```bash
cd backend
source .venv/bin/activate
python -m ml.pipeline
```

The pipeline writes `backend/data/processed/training_dataset.csv` with:

- `timestamp`
- `demand`
- time features: `hour`, `day`, `month`, `day_of_week`, `is_weekend`
- half-hourly lag features: `demand_lag_1`, `demand_lag_48`, `demand_lag_336`
- half-hourly rolling features: `demand_rolling_3`, `demand_rolling_48`, `demand_rolling_336`

The baseline training workflow now excludes retained demand context columns from model features to avoid target leakage.

## Baseline Model Training

Train baseline models on the processed NESO dataset:

```bash
cd backend
source .venv/bin/activate
python -m ml.training.train
```

Training input:

- `backend/data/processed/training_dataset.csv`

Target:

- `demand`, mapped from NESO `ND`

Approved feature columns:

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

Leakage exclusions:

- `timestamp`
- `demand`
- `TSD`
- `ENGLAND_WALES_DEMAND`
- target-derived flags
- placeholder weather columns until real weather data is introduced

Models:

- Linear Regression
- Random Forest Regressor
- XGBoost Regressor, when local dependencies are available

Metrics:

- MAE: average absolute error in MW
- RMSE: root mean squared error in MW
- MAPE: mean absolute percentage error
- R²: explained variance score

Artifacts:

- `backend/models/model.pkl`
- `backend/models/model_metadata.json`

Current limitations:

- Weather features are not yet included.
- Evaluation uses a single chronological 80/20 split.
- Rolling-origin backtesting and forecast-horizon diagnostics are still future work.

## Real Model Inference

`GET /forecast` loads:

1. `backend/models/model.pkl`
2. `backend/models/model_metadata.json`
3. `backend/data/processed/training_dataset.csv`

It takes the latest processed feature row, creates 96 timestamps at 30-minute intervals, updates calendar features, and runs the saved estimator. Predictions are converted from MW to GW. The 90% interval is currently approximated from validation RMSE.

Forecasting starts one 30-minute interval after the latest observation. Each
prediction is appended to an in-memory demand history before the next step, so
the `t-1`, `t-48`, and `t-336` lags and the 3-, 48-, and 336-period rolling
means are rebuilt recursively across the 96-point horizon. Weather is not
included, and the RMSE-based interval is not calibrated separately for each
forecast horizon.

## Scenario Simulation

`POST /simulate` accepts temperature anomaly, wind and solar generation
multipliers, EV, industrial, and residential demand multipliers, plus weekend
and bank-holiday flags. It runs both an unmodified baseline and a scenario
feature frame through the selected saved model, then returns 96 half-hourly
points using the forecast point contract. The response also includes peak and
average demand, total energy, carbon estimate, confidence, peak time, impact
deltas, and the baseline series used by the existing comparison chart.

The current trained feature schema does not yet contain weather, generation
mix, sector demand, or bank-holiday fields. These inputs therefore pass through
an isolated provisional adjustment in
`app/services/simulation_service.py`, which modifies lag and rolling-demand
features before inference. The weekend flag maps directly to `is_weekend`.
Once dedicated features are trained, the provisional function can be replaced
without changing the request or response contract.

Feature importance is calculated from the active artifact:

- Linear Regression: SHAP `LinearExplainer`
- Random Forest and XGBoost: SHAP `TreeExplainer`
- Other compatible estimators: SHAP permutation explainer

`GET /feature-importance` uses normalized mean absolute SHAP values across a
deterministic sample of processed feature rows. If SHAP cannot explain a model,
the endpoint falls back to absolute coefficients for linear models or
`feature_importances_` for tree estimators.

`GET /explain` accepts an optional `forecast_index` or `timestamp`. With no
selector it explains the highest predicted point in the current 48-hour
forecast. The response contains the prediction, SHAP base value, and top ten
features sorted by absolute local contribution. Contributions are converted
from the model's MW output into GW for the frontend.

SHAP explainers, local explanations, and global importance values are cached in
memory. The cache key includes the model artifact path, modification time, and
size, so replacing the production model automatically invalidates cached
explanations.

Train and then serve:

```bash
cd backend
source .venv/bin/activate
python -m ml.pipeline
python -m ml.training.train
uvicorn app.main:app --reload --port 8001
```

If the model, metadata, or processed dataset is unavailable, the API logs a warning and returns the existing typed mock response instead of failing the frontend.

## Local Development

Create an environment and install dependencies:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Run the API:

```bash
uvicorn app.main:app --reload --port 8001
```

The API will be available at `http://127.0.0.1:8001`.

## Configuration

Settings are loaded from environment variables with the `GRIDCAST_` prefix.

Examples:

```bash
GRIDCAST_ENVIRONMENT=local
GRIDCAST_WEATHER_API_KEY=...
GRIDCAST_MODEL_ARTIFACT_PATH=/path/to/model.pkl
GRIDCAST_MODEL_METADATA_PATH=/path/to/model_metadata.json
GRIDCAST_TRAINING_DATASET_PATH=/path/to/training_dataset.csv
```

Do not hardcode data paths, model paths, or external API keys in application code.
