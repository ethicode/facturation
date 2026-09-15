from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
DB_PATH = DATA_DIR / "app.sqlite3"
LEGACY_DB_PATH = DATA_DIR / "db.json"
UPLOADS_DIR = DATA_DIR / "uploads"

CORS_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:5175",
    "http://127.0.0.1:5175",
    "http://localhost:4173",
    "http://127.0.0.1:4173",
]

CORS_ORIGIN_REGEX = r"^http://(localhost|127\.0\.0\.1):\d+$"