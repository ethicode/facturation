import pytest
from fastapi import HTTPException

from app.schemas import BudgetItemCreate, BudgetItemUpdate, BudgetUpsert, MissionCreate
from app.services import BackendService
from app.storage import JsonStore


def make_mission(item_id: str, amount: str) -> MissionCreate:
    return MissionCreate(
        objet_mission="Déplacement professionnel",
        destination="Paris",
        pays="France",
        date_depart="2026-10-10",
        date_retour="2026-10-12",
        montant_estimatif=amount,
        budget_concerne="",
        budget_item_id=item_id,
    )


def test_mission_consumption_is_linked_persisted_and_reduces_available_budget(tmp_path):
    service = BackendService(store=JsonStore(path=tmp_path / "db.sqlite3"))
    service.save_direction_budget(BudgetUpsert(direction="Direction Test", allocated=0, engaged=0))
    state = service.create_direction_budget_item(
        BudgetItemCreate(direction="Direction Test", label="Déplacements", allocated=500)
    )
    item = state.budgetItems[0]

    mission = service.create_mission(make_mission(item.id, "350 CFA"))
    loaded_mission = service.list_missions()[0]

    assert mission.budget_concerne == "Direction Test — Déplacements"
    assert loaded_mission.budget_item_id == item.id
    assert loaded_mission.budget_consumed == 350
    assert loaded_mission.budget_consumed_at
    assert item.allocated - loaded_mission.budget_consumed == 150

    with pytest.raises(HTTPException, match="Budget insuffisant"):
        service.create_mission(make_mission(item.id, "200 CFA"))


def test_consumed_budget_line_cannot_be_reduced_or_deleted(tmp_path):
    service = BackendService(store=JsonStore(path=tmp_path / "db.sqlite3"))
    service.save_direction_budget(BudgetUpsert(direction="Direction Test", allocated=0, engaged=0))
    state = service.create_direction_budget_item(
        BudgetItemCreate(direction="Direction Test", label="Déplacements", allocated=500)
    )
    item_id = state.budgetItems[0].id
    service.create_mission(make_mission(item_id, "350 CFA"))

    with pytest.raises(HTTPException, match="inférieur au montant déjà consommé"):
        service.update_direction_budget_item(
            item_id,
            BudgetItemUpdate(label="Déplacements", allocated=300),
        )

    with pytest.raises(HTTPException, match="référencée par une ou plusieurs missions"):
        service.delete_direction_budget_item(item_id)