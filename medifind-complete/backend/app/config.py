import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env file from project root or backend
BASE_DIR = Path(__file__).resolve().parent.parent
REPO_ROOT = BASE_DIR.parent

load_dotenv(REPO_ROOT / ".env")
load_dotenv(BASE_DIR / ".env")

def get_db_path() -> str:
    env_path = os.getenv("DB_PATH")
    if env_path:
        p = Path(env_path)
        if p.is_absolute():
            return str(p)
        # Check relative to BASE_DIR or REPO_ROOT
        if (BASE_DIR / p).exists():
            return str(BASE_DIR / p)
        return str(REPO_ROOT / p)
    # Default search locations
    repo_db = REPO_ROOT / "database" / "medifind.db"
    if repo_db.exists():
        return str(repo_db)
    backend_rel_db = BASE_DIR / ".." / "database" / "medifind.db"
    return str(backend_rel_db.resolve())

DB_PATH = get_db_path()
SECRET_KEY = os.getenv("SECRET_KEY", "medifind-dev-insecure-secret-key-32b")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24

# CORS
FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173,http://localhost:3000,*")
ORIGINS = [o.strip() for o in FRONTEND_ORIGIN.split(",") if o.strip()]

# Demo Reset & Reliability
DEMO_ADMIN_KEY = os.getenv("DEMO_ADMIN_KEY", "medifind-demo-secret-2025")
PING_TIMEOUT_SECONDS = int(os.getenv("PING_TIMEOUT_SECONDS", "90"))

# Optional AI
USE_AI = os.getenv("USE_AI", "false").lower() in ("true", "1", "yes")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# City coordinates
CITY_NAME = os.getenv("CITY_NAME", "Jaipur")
CITY_LAT = float(os.getenv("CITY_LAT", "26.9124"))
CITY_LNG = float(os.getenv("CITY_LNG", "75.7873"))
