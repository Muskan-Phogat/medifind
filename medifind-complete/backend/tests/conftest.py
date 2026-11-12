import os
import sys
import shutil
import tempfile
import pytest
from pathlib import Path
from starlette.testclient import TestClient

# Ensure backend directory is in sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

# Path to the actual seeded DB
MASTER_DB = BASE_DIR.parent / "database" / "medifind.db"


@pytest.fixture(scope="session", autouse=True)
def setup_test_database():
    """
    Creates an isolated temporary copy of medifind.db for the test session.
    Guarantees seeded database is never modified by test runs.
    """
    temp_dir = tempfile.mkdtemp(prefix="medifind_test_")
    temp_db_path = Path(temp_dir) / "test_medifind.db"
    
    if MASTER_DB.exists():
        shutil.copy2(MASTER_DB, temp_db_path)
    else:
        # Fallback to backend/../database
        alt_db = BASE_DIR / ".." / "database" / "medifind.db"
        shutil.copy2(alt_db, temp_db_path)

    os.environ["DB_PATH"] = str(temp_db_path)

    yield str(temp_db_path)

    # Cleanup temporary database
    try:
        shutil.rmtree(temp_dir, ignore_errors=True)
    except Exception:
        pass


@pytest.fixture
def client(setup_test_database):
    """Provides FastAPI test client pointing to the isolated test database."""
    from app.main import app
    with TestClient(app) as test_client:
        yield test_client
