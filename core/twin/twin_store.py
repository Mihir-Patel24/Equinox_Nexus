"""
Twin Store — PostgreSQL & SQLite Database Store for Financial Digital Twins
Thread-safe database store supporting both PostgreSQL and SQLite dialects.
Falls back to SQLite dynamically if PostgreSQL is unavailable.
"""

import os
import json
import sqlite3
import threading
from datetime import datetime
from typing import Dict, Optional, List
from .financial_twin import FinancialTwin, SimulationRecord

# Config
DB_DIALECT = os.getenv("DB_DIALECT", "sqlite").lower()
DATABASE_URL = os.getenv("DATABASE_URL")

POSTGRES_HOST = os.getenv("POSTGRES_HOST", "localhost")
POSTGRES_PORT = os.getenv("POSTGRES_PORT", "5432")
POSTGRES_DB = os.getenv("POSTGRES_DB", "equinox_nexus")
POSTGRES_USER = os.getenv("POSTGRES_USER", "postgres")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "postgres")

SQLITE_PATH = os.path.join(os.path.dirname(__file__), "twins.db")
_lock = threading.Lock()

# Detect active database type
_use_postgres = False
if DB_DIALECT == "postgres" or DATABASE_URL:
    try:
        import psycopg2
        _use_postgres = True
    except ImportError:
        print("TwinStore: psycopg2-binary not installed. Falling back to SQLite.")

def _get_connection():
    global _use_postgres
    if _use_postgres:
        try:
            if DATABASE_URL:
                conn = psycopg2.connect(DATABASE_URL)
            else:
                conn = psycopg2.connect(
                    host=POSTGRES_HOST,
                    port=POSTGRES_PORT,
                    database=POSTGRES_DB,
                    user=POSTGRES_USER,
                    password=POSTGRES_PASSWORD
                )
            return conn, "postgres"
        except Exception as e:
            print(f"TwinStore: PostgreSQL connection failed ({e}). Falling back to SQLite.")
            _use_postgres = False  # Dynamic fallback
            
    conn = sqlite3.connect(SQLITE_PATH)
    conn.row_factory = sqlite3.Row
    return conn, "sqlite"


def init_db():
    """Create tables in the active database."""
    with _lock:
        conn, dialect = _get_connection()
        cursor = conn.cursor()
        
        if dialect == "postgres":
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS twins (
                twin_id VARCHAR(50) PRIMARY KEY,
                user_profile TEXT,
                created_at VARCHAR(50),
                last_updated VARCHAR(50),
                profile_version INTEGER,
                alerts TEXT
            )
            """)
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS simulation_history (
                simulation_id VARCHAR(50) PRIMARY KEY,
                twin_id VARCHAR(50),
                target_city VARCHAR(100),
                timestamp VARCHAR(50),
                viability_score REAL,
                net_annual_savings REAL,
                effective_tax_rate REAL,
                col_multiplier REAL,
                quality_of_life_score REAL,
                fx_rate_at_time TEXT,
                full_result TEXT,
                FOREIGN KEY(twin_id) REFERENCES twins(twin_id)
            )
            """)
        else:
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS twins (
                twin_id TEXT PRIMARY KEY,
                user_profile TEXT,
                created_at TEXT,
                last_updated TEXT,
                profile_version INTEGER,
                alerts TEXT
            )
            """)
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS simulation_history (
                simulation_id TEXT PRIMARY KEY,
                twin_id TEXT,
                target_city TEXT,
                timestamp TEXT,
                viability_score REAL,
                net_annual_savings REAL,
                effective_tax_rate REAL,
                col_multiplier REAL,
                quality_of_life_score REAL,
                fx_rate_at_time TEXT,
                full_result TEXT,
                FOREIGN KEY(twin_id) REFERENCES twins(twin_id)
            )
            """)
        conn.commit()
        conn.close()


# Initialize database schema
try:
    init_db()
except Exception as e:
    print(f"TwinStore: Initialization error: {e}")


def save_twin(twin: FinancialTwin) -> None:
    """Save or update a FinancialTwin in the active database (PostgreSQL or SQLite)."""
    with _lock:
        conn, dialect = _get_connection()
        cursor = conn.cursor()
        
        # Save or update Twin metadata
        if dialect == "postgres":
            cursor.execute("""
            INSERT INTO twins (twin_id, user_profile, created_at, last_updated, profile_version, alerts)
            VALUES (%s, %s, %s, %s, %s, %s)
            ON CONFLICT (twin_id) DO UPDATE SET
                user_profile = EXCLUDED.user_profile,
                last_updated = EXCLUDED.last_updated,
                profile_version = EXCLUDED.profile_version,
                alerts = EXCLUDED.alerts
            """, (
                twin.twin_id,
                json.dumps(twin.user_profile),
                twin.created_at.isoformat(),
                twin.last_updated.isoformat(),
                twin.profile_version,
                json.dumps(twin.alerts)
            ))
            
            # Insert simulation records
            for r in twin.simulation_history:
                cursor.execute("""
                INSERT INTO simulation_history (
                    simulation_id, twin_id, target_city, timestamp, viability_score,
                    net_annual_savings, effective_tax_rate, col_multiplier, quality_of_life_score,
                    fx_rate_at_time, full_result
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (simulation_id) DO NOTHING
                """, (
                    r.simulation_id,
                    twin.twin_id,
                    r.target_city,
                    r.timestamp.isoformat(),
                    r.viability_score,
                    r.net_annual_savings,
                    r.effective_tax_rate,
                    r.col_multiplier,
                    r.quality_of_life_score,
                    json.dumps(r.fx_rate_at_time),
                    json.dumps(r.full_result)
                ))
        else:
            cursor.execute("""
            INSERT OR REPLACE INTO twins (twin_id, user_profile, created_at, last_updated, profile_version, alerts)
            VALUES (?, ?, ?, ?, ?, ?)
            """, (
                twin.twin_id,
                json.dumps(twin.user_profile),
                twin.created_at.isoformat(),
                twin.last_updated.isoformat(),
                twin.profile_version,
                json.dumps(twin.alerts)
            ))
            
            for r in twin.simulation_history:
                cursor.execute("""
                INSERT OR IGNORE INTO simulation_history (
                    simulation_id, twin_id, target_city, timestamp, viability_score,
                    net_annual_savings, effective_tax_rate, col_multiplier, quality_of_life_score,
                    fx_rate_at_time, full_result
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    r.simulation_id,
                    twin.twin_id,
                    r.target_city,
                    r.timestamp.isoformat(),
                    r.viability_score,
                    r.net_annual_savings,
                    r.effective_tax_rate,
                    r.col_multiplier,
                    r.quality_of_life_score,
                    json.dumps(r.fx_rate_at_time),
                    json.dumps(r.full_result)
                ))
            
        conn.commit()
        conn.close()


def create_twin(user_profile: dict) -> FinancialTwin:
    """Create a new Financial Twin and persist it."""
    twin = FinancialTwin(user_profile=user_profile)
    save_twin(twin)
    return twin


def get_twin(twin_id: str) -> Optional[FinancialTwin]:
    """Retrieve a FinancialTwin by ID."""
    with _lock:
        conn, dialect = _get_connection()
        cursor = conn.cursor()
        
        if dialect == "postgres":
            cursor.execute("SELECT * FROM twins WHERE twin_id = %s", (twin_id,))
        else:
            cursor.execute("SELECT * FROM twins WHERE twin_id = ?", (twin_id,))
            
        twin_row = cursor.fetchone()
        if not twin_row:
            conn.close()
            return None
        
        if dialect == "postgres":
            cursor.execute("SELECT * FROM simulation_history WHERE twin_id = %s ORDER BY timestamp ASC", (twin_id,))
        else:
            cursor.execute("SELECT * FROM simulation_history WHERE twin_id = ? ORDER BY timestamp ASC", (twin_id,))
            
        history_rows = cursor.fetchall()
        conn.close()

    # Reconstruct SimulationRecord list
    history = []
    for r in history_rows:
        record = SimulationRecord(
            simulation_id=r["simulation_id"],
            target_city=r["target_city"],
            timestamp=datetime.fromisoformat(r["timestamp"]),
            viability_score=r["viability_score"],
            net_annual_savings=r["net_annual_savings"],
            effective_tax_rate=r["effective_tax_rate"],
            col_multiplier=r["col_multiplier"],
            quality_of_life_score=r["quality_of_life_score"],
            fx_rate_at_time=json.loads(r["fx_rate_at_time"]),
            full_result=json.loads(r["full_result"])
        )
        history.append(record)

    twin = FinancialTwin(
        twin_id=twin_row["twin_id"],
        user_profile=json.loads(twin_row["user_profile"]),
        simulation_history=history,
        created_at=datetime.fromisoformat(twin_row["created_at"]),
        last_updated=datetime.fromisoformat(twin_row["last_updated"]),
        profile_version=twin_row["profile_version"],
        alerts=json.loads(twin_row["alerts"])
    )
    return twin


def get_or_create_twin(twin_id: Optional[str], user_profile: dict) -> FinancialTwin:
    """Get existing twin or create a new one, keeping database updated."""
    if twin_id:
        twin = get_twin(twin_id)
        if twin:
            twin.user_profile.update(user_profile)
            twin.last_updated = datetime.utcnow()
            save_twin(twin)
            return twin
    return create_twin(user_profile)


def update_twin(twin_id: str, result: dict, target_city: str, fx_snapshot: Optional[dict] = None) -> None:
    """Add simulation result to twin and persist to the active database.
    
    Args:
        twin_id:     The twin's unique identifier.
        result:      Full LangGraph state dict from agent pipeline.
        target_city: City that was just simulated.
        fx_snapshot: Live FX rates at simulation time — enables drift detection.
                     Pass the ContinuousMonitor's get_latest_fx() output here.
    """
    twin = get_twin(twin_id)
    if twin:
        twin.update_with_result(result, target_city, fx_snapshot=fx_snapshot)
        save_twin(twin)


def list_twins() -> list:
    """Return summary of all active twins (for monitoring)."""
    with _lock:
        conn, dialect = _get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT twin_id FROM twins")
        ids = [row["twin_id"] for row in cursor.fetchall()]
        conn.close()
    
    twins_list = []
    for twin_id in ids:
        twin = get_twin(twin_id)
        if twin:
            twins_list.append(twin.get_summary())
    return twins_list


def get_all_twins() -> Dict[str, FinancialTwin]:
    """Return all twins in active database (for monitoring loop)."""
    with _lock:
        conn, dialect = _get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT twin_id FROM twins")
        ids = [row["twin_id"] for row in cursor.fetchall()]
        conn.close()
        
    all_twins = {}
    for twin_id in ids:
        twin = get_twin(twin_id)
        if twin:
            all_twins[twin_id] = twin
    return all_twins
