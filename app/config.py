import os
from pathlib import Path

# Base directory of the project
BASE_DIR = Path(__file__).resolve().parent.parent

# Database configuration (SQLite)
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR}/edna_backend.db")

# Directories for uploads, generated reports, and demo files
UPLOAD_DIR = BASE_DIR / "app" / "storage" / "uploads"
REPORT_DIR = BASE_DIR / "app" / "storage" / "reports"
DEMO_DIR = BASE_DIR / "demo_data"

# Ensure directories exist
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
REPORT_DIR.mkdir(parents=True, exist_ok=True)
DEMO_DIR.mkdir(parents=True, exist_ok=True)

# Default biological analysis parameters
DEFAULT_MIN_LENGTH = 50
DEFAULT_MAX_LENGTH = 5000
DEFAULT_MIN_QUALITY = 20.0
DEFAULT_SIMILARITY_THRESHOLD = 85.0  # Percentage similarity cutoff for taxonomy matching
