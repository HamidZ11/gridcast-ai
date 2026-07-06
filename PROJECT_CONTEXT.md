# GridCast AI - Project Context

GridCast AI is a full-stack machine learning portfolio project for short-term UK electricity demand forecasting.

The product goal is a polished enterprise analytics dashboard backed by a clean FastAPI and ML architecture. It should demonstrate practical AI/ML engineering, not only notebook-based modelling.

## Current Status

Frontend pages completed:

- Overview
- Forecast Analytics
- Model Insights

Backend architecture completed:

- FastAPI app structure
- Mock API endpoints
- Pydantic response schemas
- Configuration management
- Swappable model interface
- Placeholder ML pipeline modules

API endpoints currently return mock data. The frontend also continues to use local mock data until API integration is ready.

## Next Stage

The next stage is real data ingestion and ML training:

- Select and ingest National Grid ESO demand data
- Add weather data ingestion
- Build data cleaning and feature engineering pipeline
- Train baseline models
- Compare Linear Regression, Random Forest, and XGBoost
- Add evaluation and SHAP explainability
- Connect the frontend to the FastAPI backend

## Design Direction

The UI should remain a premium light-theme analytics product inspired by Linear, Vercel Analytics, TradingView, Bloomberg-style charts, and modern enterprise software.

Avoid terminal styling, dark mode, student-dashboard visuals, and overcomplicated ML clutter.
