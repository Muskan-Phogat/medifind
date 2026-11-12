import sqlite3
import os
from typing import Generator, Any, List, Optional, Dict
from contextlib import contextmanager
from app.config import get_db_path

def get_connection(db_path: Optional[str] = None) -> sqlite3.Connection:
    target_path = db_path or get_db_path()
    conn = sqlite3.connect(target_path, check_same_thread=False, timeout=30.0)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    conn.execute("PRAGMA journal_mode = WAL;")
    conn.execute("PRAGMA busy_timeout = 15000;")
    return conn

@contextmanager
def get_db_context(db_path: Optional[str] = None) -> Generator[sqlite3.Connection, None, None]:
    conn = get_connection(db_path)
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

def get_db() -> Generator[sqlite3.Connection, None, None]:
    """FastAPI dependency yielding a database connection."""
    with get_db_context() as conn:
        yield conn

def query_all(query: str, params: tuple = (), db_path: Optional[str] = None) -> List[Dict[str, Any]]:
    """Execute a parameterized query returning all rows as dicts."""
    with get_db_context(db_path) as conn:
        cursor = conn.cursor()
        cursor.execute(query, params)
        rows = cursor.fetchall()
        return [dict(row) for row in rows]

def query_one(query: str, params: tuple = (), db_path: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """Execute a parameterized query returning a single row as dict."""
    with get_db_context(db_path) as conn:
        cursor = conn.cursor()
        cursor.execute(query, params)
        row = cursor.fetchone()
        return dict(row) if row else None

def execute_write(query: str, params: tuple = (), db_path: Optional[str] = None) -> int:
    """Execute an INSERT/UPDATE/DELETE query and return lastrowid or rowcount."""
    with get_db_context(db_path) as conn:
        cursor = conn.cursor()
        cursor.execute(query, params)
        return cursor.lastrowid
