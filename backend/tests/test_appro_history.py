from app.schemas import BudgetItemCreate, BudgetItemUpdate, BudgetUpsert, SupplyTicketCreate
from app.services import BackendService
from app.storage import JsonStore


def test_budget_creation_and_update_are_persisted(tmp_path):
    service = BackendService(store=JsonStore(path=tmp_path / "db.json"))

    created = service.save_direction_budget(
        BudgetUpsert(direction="Direction Essai", allocated=1_000, engaged=200)
    )
    assert next(line for line in created.budgets if line.direction == "Direction Essai").allocated == 1_000

    updated = service.save_direction_budget(
        BudgetUpsert(direction="Direction Essai", allocated=2_000, engaged=500)
    )
    reloaded = service.get_appro_state()
    budget = next(line for line in reloaded.budgets if line.direction == "Direction Essai")

    assert budget.allocated == 2_000
    assert budget.engaged == 500
    assert len([line for line in updated.budgets if line.direction == "Direction Essai"]) == 1


def test_budget_item_is_persisted_and_increases_direction_allocation(tmp_path):
    service = BackendService(store=JsonStore(path=tmp_path / "db.json"))
    service.save_direction_budget(BudgetUpsert(direction="Direction Essai", allocated=1_000, engaged=200))

    created = service.create_direction_budget_item(
        BudgetItemCreate(direction="Direction Essai", label="Fournitures", allocated=350)
    )
    reloaded = service.get_appro_state()

    budget = next(line for line in reloaded.budgets if line.direction == "Direction Essai")
    item = next(line for line in reloaded.budgetItems if line.direction == "Direction Essai")
    assert budget.allocated == 1_350
    assert budget.engaged == 200
    assert item.label == "Fournitures"
    assert item.allocated == 350
    assert item.createdAt
    assert item.createdBy == "DirFin"
    assert created.dirfinHistory[0].action == "Ligne budgétaire ajoutée"


def test_budget_item_can_be_updated_and_deleted_with_audit_metadata(tmp_path):
    service = BackendService(store=JsonStore(path=tmp_path / "db.json"))
    service.save_direction_budget(BudgetUpsert(direction="Direction Essai", allocated=1_000, engaged=200))
    created = service.create_direction_budget_item(
        BudgetItemCreate(direction="Direction Essai", label="Fournitures", allocated=350, actor="alice@example.com")
    )
    item_id = created.budgetItems[0].id

    updated = service.update_direction_budget_item(
        item_id,
        BudgetItemUpdate(label="Mobilier", allocated=500, actor="bob@example.com"),
    )
    updated_item = next(line for line in updated.budgetItems if line.id == item_id)
    assert updated_item.label == "Mobilier"
    assert updated_item.allocated == 500
    assert updated_item.createdBy == "alice@example.com"
    assert updated_item.updatedAt
    assert updated_item.updatedBy == "bob@example.com"
    assert next(line for line in updated.budgets if line.direction == "Direction Essai").allocated == 1_500

    deleted = service.delete_direction_budget_item(item_id, actor="carol@example.com")
    assert not any(line.id == item_id for line in deleted.budgetItems)
    assert next(line for line in deleted.budgets if line.direction == "Direction Essai").allocated == 1_000
    assert deleted.dirfinHistory[0].actor == "carol@example.com"


def test_engaged_amount_can_exceed_allocated_budget(tmp_path):
    service = BackendService(store=JsonStore(path=tmp_path / "db.json"))

    service.save_direction_budget(
        BudgetUpsert(direction="Direction Essai", allocated=1_000, engaged=1_250)
    )
    reloaded = service.get_appro_state()
    budget = next(line for line in reloaded.budgets if line.direction == "Direction Essai")

    assert budget.engaged > budget.allocated
    assert budget.allocated - budget.engaged == -250


def test_conditional_appro_status_is_recorded_in_ticket_history(tmp_path):
    service = BackendService(store=JsonStore(path=tmp_path / "db.json"))
    ticket = service.create_supply_ticket(
        SupplyTicketCreate(
            direction="Operations",
            objet="Demande avec budget insuffisant",
            montant=1_500,
            devise="XAF",
            direction_demandeur="Operations",
            budget_previsionnel=1_500,
            actor="Demandeur test",
        )
    )
    service.save_direction_budget(BudgetUpsert(direction="Operations", allocated=1_000, actor="DirFin test"))

    state = service.verify_ticket_budget(ticket.id, actor="Agent approvisionnement test")
    updated_ticket = next(item for item in state.tickets if item.id == ticket.id)

    assert updated_ticket.statut == "Demande d'information complémentaire (Traitement service approvisionnement)"
    assert updated_ticket.history[0].action == (
        "Statut passé à Demande d'information complémentaire (Traitement service approvisionnement)"
    )