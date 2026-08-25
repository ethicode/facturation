from copy import deepcopy
from pathlib import Path

from app.schemas import AppState, AuthLoginRequest
from app.seed_data import SEED_DATA, USER_PASSWORDS
from app.services import BackendService
from app.storage import JsonStore


def test_login_and_me_with_seed_user(tmp_path):
    store = JsonStore(path=tmp_path / "db.json")
    service = BackendService(store=store)

    token_response = service.login(AuthLoginRequest(username="comptable", password=USER_PASSWORDS["comptable"]))

    assert token_response.user.role == "utilisateur"
    assert token_response.access_token

    current_user = service.get_current_user(token_response.access_token)
    assert current_user.username == "comptable"
    assert current_user.role == "utilisateur"


def test_login_rehydrates_admin_when_missing_from_persisted_state(tmp_path):
    store = JsonStore(path=tmp_path / "db.json")
    seed_state = AppState.model_validate(deepcopy(SEED_DATA))
    seed_state.users = [user for user in seed_state.users if user.username != "admin"]
    store.write(seed_state)

    service = BackendService(store=store)
    token_response = service.login(AuthLoginRequest(username="admin", password=USER_PASSWORDS["admin"]))

    assert token_response.user.username == "admin"
    assert token_response.user.role == "administrateur"
