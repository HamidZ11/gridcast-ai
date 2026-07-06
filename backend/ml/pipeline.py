"""Training data preparation pipeline."""

from pathlib import Path

import pandas as pd

from ml.features import build_training_features
from ml.ingestion import CalendarDataLoader, DemandDataLoader, WeatherDataLoader
from ml.preprocessing.preprocessing import preprocess_demand_data
from ml.profiling import create_profile, print_profile, save_profile
from ml.validation import ValidationReport, validate_dataset

BACKEND_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_PROCESSED_DIR = BACKEND_ROOT / "data" / "processed"
DEFAULT_PROFILE_PATH = DEFAULT_PROCESSED_DIR / "profile.json"
DEFAULT_TRAINING_DATASET_PATH = DEFAULT_PROCESSED_DIR / "training_dataset.csv"


def prepare_training_data(
    demand_loader: DemandDataLoader | None = None,
    weather_loader: WeatherDataLoader | None = None,
    calendar_loader: CalendarDataLoader | None = None,
    profile_output_path: Path = DEFAULT_PROFILE_PATH,
    training_dataset_output_path: Path = DEFAULT_TRAINING_DATASET_PATH,
    print_profile_summary: bool = True,
) -> tuple[pd.DataFrame, ValidationReport, ValidationReport]:
    """Prepare a clean feature-engineered dataset ready for model training.

    Pipeline order:
        Load -> Validate -> Preprocess -> Feature engineer -> Final validation.
    """
    demand_loader = demand_loader or DemandDataLoader()
    weather_loader = weather_loader or WeatherDataLoader()
    calendar_loader = calendar_loader or CalendarDataLoader()

    demand = demand_loader.load()
    profile = create_profile(demand)
    save_profile(profile, profile_output_path)
    if print_profile_summary:
        print_profile(profile)

    expected_interval = pd.Timedelta(minutes=30)
    initial_report = validate_dataset(
        demand,
        duplicate_subset=["timestamp"],
        expected_interval=expected_interval,
    )
    processed = preprocess_demand_data(demand)
    weather = weather_loader.load_for_timestamps(processed["timestamp"])
    calendar = calendar_loader.load_for_timestamps(processed["timestamp"])
    processed = processed.merge(weather, on="timestamp", how="left")
    processed = processed.merge(calendar, on="timestamp", how="left")

    features = build_training_features(processed)
    final_report = validate_dataset(
        features,
        duplicate_subset=["timestamp"],
        expected_interval=expected_interval,
    )
    training_dataset_output_path.parent.mkdir(parents=True, exist_ok=True)
    features.to_csv(training_dataset_output_path, index=False)

    return features, initial_report, final_report


def main() -> None:
    """Run the data preparation pipeline from the command line."""
    features, initial_report, final_report = prepare_training_data()
    if not initial_report.passed or not final_report.passed:
        raise SystemExit(
            f"Validation failed: {initial_report.issues + final_report.issues}"
        )

    print("\nPrepared training dataset")
    print("-------------------------")
    print(f"Rows: {len(features):,}")
    print(f"Columns: {len(features.columns):,}")
    print(f"Output: {DEFAULT_TRAINING_DATASET_PATH}")
    print(f"Profile: {DEFAULT_PROFILE_PATH}")


if __name__ == "__main__":
    main()
