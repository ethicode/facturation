import json
import os
from json import JSONDecodeError
from pathlib import Path
from threading import RLock
from copy import deepcopy

from .config import DATA_DIR, DB_PATH
from .schemas import AppState
from .seed_data import SEED_DATA


class JsonStore:
    def __init__(self, path=DB_PATH):
        self.path = Path(path)
        self.backup_path = self.path.with_suffix(f"{self.path.suffix}.bak")
        self._lock = RLock()

    def ensure_seed(self) -> None:
        self.ensure_seed_parent()
        if not self.path.exists():
            self.write(AppState.model_validate(deepcopy(SEED_DATA)))

    def read(self) -> AppState:
        with self._lock:
            self.ensure_seed()
            try:
                raw = self.path.read_text(encoding="utf-8")
                payload = json.loads(raw)
                return AppState.model_validate(payload)
            except (JSONDecodeError, OSError):
                return self._recover_from_backup_or_seed()

    def write(self, state: AppState) -> AppState:
        with self._lock:
            self.ensure_seed_parent()
            serialized = state.model_dump_json(indent=2)
            tmp_path = self.path.with_suffix(f"{self.path.suffix}.tmp")

            try:
                tmp_path.write_text(serialized, encoding="utf-8")
                os.replace(tmp_path, self.path)
                self.backup_path.write_text(serialized, encoding="utf-8")
            finally:
                if tmp_path.exists():
                    tmp_path.unlink()

            return state

    def ensure_seed_parent(self) -> None:
        self.path.parent.mkdir(parents=True, exist_ok=True)

    def _recover_from_backup_or_seed(self) -> AppState:
        if self.backup_path.exists():
            backup_raw = self.backup_path.read_text(encoding="utf-8")
            if backup_raw.strip():
                payload = json.loads(backup_raw)
                state = AppState.model_validate(payload)
                self.path.write_text(backup_raw, encoding="utf-8")
                return state

        fallback_state = AppState.model_validate(deepcopy(SEED_DATA))
        self.write(fallback_state)
        return fallback_state