import pytest
from fastapi import HTTPException

from app.schemas import MissionCreate, MissionStatusUpdate
from app.services import BackendService
from app.storage import JsonStore


def create_test_mission(service):
    return service.create_mission(MissionCreate(
        objet_mission="Mission test",
        destination="Dakar",
        pays="Sénégal",
        date_depart="2026-10-12",
        date_retour="2026-10-14",
        montant_estimatif="100 CFA",
        budget_concerne="Budget test",
    ), actor="alice@example.com")


def test_mission_status_and_history_survive_reload(tmp_path):
    path = tmp_path / "db.sqlite3"
    service = BackendService(JsonStore(path=path))
    mission = create_test_mission(service)
    fresh_service = BackendService(JsonStore(path=path))
    loaded = next(item for item in fresh_service.list_missions() if item.code == mission.code)
    assert loaded.statut == "Validation responsable metier"
    assert loaded.history[0].actor == "alice@example.com"
    assert loaded.history[-1].action == "Creation"
    assert loaded.history[0].at

    for status in ["Retour demande (Validation responsable metier)", "Validation responsable metier"]:
        fresh_service.update_mission_status(mission.code, MissionStatusUpdate(next_status=status), "bob@example.com")
        if status.startswith("Retour demande"):
            returned = next(item for item in fresh_service.list_missions() if item.code == mission.code)
            assert returned.statut == "Creation"
            assert returned.history[0].action == status
    loaded = next(item for item in fresh_service.list_missions() if item.code == mission.code)
    assert len(loaded.history) == 4
    assert loaded.history[0].action == loaded.history[-2].action


def test_mission_rejects_invalid_and_stale_transitions(tmp_path):
    service = BackendService(JsonStore(path=tmp_path / "db.sqlite3"))
    mission = create_test_mission(service)
    with pytest.raises(HTTPException) as invalid:
        service.update_mission_status(mission.code, MissionStatusUpdate(next_status="Cloturee"), "alice@example.com")
    assert invalid.value.status_code == 400
    with pytest.raises(HTTPException) as stale:
        service.update_mission_status(mission.code, MissionStatusUpdate(
            next_status="Validation responsable metier", expected_status="Validation DRH",
        ), "alice@example.com")
    assert stale.value.status_code == 409