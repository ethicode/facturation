import json
import sqlite3
from pathlib import Path
from threading import RLock
from copy import deepcopy

from .config import DB_PATH, LEGACY_DB_PATH
from .schemas import AppState
from .seed_data import SEED_DATA


class JsonStore:
    def __init__(self, path=DB_PATH):
        self.path = Path(path)
        self.legacy_path = LEGACY_DB_PATH if self.path == DB_PATH else self.path.with_name(f"{self.path.stem}.json")
        self._lock = RLock()

    def ensure_seed(self) -> None:
        self.ensure_seed_parent()
        if not self.path.exists() and self.legacy_path.exists():
            self._migrate_legacy_json()
            return

        if not self.path.exists():
            self.write(AppState.model_validate(deepcopy(SEED_DATA)))

    def read(self) -> AppState:
        with self._lock:
            self.ensure_seed()
            try:
                with sqlite3.connect(self.path) as connection:
                    connection.row_factory = sqlite3.Row
                    self._ensure_schema(connection)
                    row = connection.execute(
                        "SELECT payload FROM app_state WHERE id = ?",
                        ("state",),
                    ).fetchone()
                    if row and row["payload"]:
                        return AppState.model_validate(json.loads(row["payload"]))
            except sqlite3.DatabaseError:
                return self._recover_from_legacy_or_seed()

            return self._recover_from_legacy_or_seed()

    def write(self, state: AppState) -> AppState:
        with self._lock:
            self.ensure_seed_parent()
            serialized = state.model_dump_json(indent=2)

            with sqlite3.connect(self.path) as connection:
                self._ensure_schema(connection)
                connection.execute(
                    """
                    INSERT INTO app_state (id, payload, updated_at)
                    VALUES (?, ?, CURRENT_TIMESTAMP)
                    ON CONFLICT(id) DO UPDATE SET
                        payload = excluded.payload,
                        updated_at = CURRENT_TIMESTAMP
                    """,
                    ("state", serialized),
                )
                connection.commit()

            return state

    def ensure_seed_parent(self) -> None:
        self.path.parent.mkdir(parents=True, exist_ok=True)

    def _ensure_schema(self, connection: sqlite3.Connection) -> None:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS app_state (
                id TEXT PRIMARY KEY,
                payload TEXT NOT NULL,
                updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
            """
        )

    def _recover_from_legacy_or_seed(self) -> AppState:
        if self.legacy_path != self.path and self.legacy_path.exists():
            try:
                legacy_payload = json.loads(self.legacy_path.read_text(encoding="utf-8"))
                state = AppState.model_validate(legacy_payload)
                self.write(state)
                return state
            except (json.JSONDecodeError, OSError):
                pass

        fallback_state = AppState.model_validate(deepcopy(SEED_DATA))
        self.write(fallback_state)
        return fallback_state

    def _migrate_legacy_json(self) -> None:
        legacy_raw = self.legacy_path.read_text(encoding="utf-8")
        if not legacy_raw.strip():
            self.write(AppState.model_validate(deepcopy(SEED_DATA)))
            return

        payload = json.loads(legacy_raw)
        self.write(AppState.model_validate(payload))