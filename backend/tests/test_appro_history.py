from app.schemas import BudgetUpsert, SupplyTicketCreate
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