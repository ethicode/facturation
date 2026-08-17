from copy import deepcopy
import sqlite3

from app.schemas import AppState
from app.seed_data import SEED_DATA
from app.storage import JsonStore


def test_read_recovers_when_main_json_is_temporarily_empty(tmp_path):
    path = tmp_path / 'db.json'
    store = JsonStore(path=path)

    seed_state = AppState.model_validate(deepcopy(SEED_DATA))
    store.write(seed_state)

    # Simulate a truncated write that leaves the primary file empty.
    path.write_text('', encoding='utf-8')

    recovered = store.read()

    assert recovered.users
    with sqlite3.connect(path) as connection:
        payload = connection.execute("SELECT payload FROM app_state WHERE id = ?", ('state',)).fetchone()

    assert payload and payload[0]
