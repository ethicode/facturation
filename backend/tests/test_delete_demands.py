from app.schemas import FactureCreate, SupplyTicketCreate
from app.services import BackendService
from app.storage import JsonStore


def test_delete_facture_removes_it_from_state(tmp_path):
    store = JsonStore(path=tmp_path / 'db.json')
    service = BackendService(store=store)

    created = service.create_facture(
        FactureCreate(
            fournisseur='Fournisseur test',
            montant=1800,
            devise='XAF',
            centreCout='CC-001',
            description='Demande a supprimer',
            echeance='2026-08-15',
            priorite='Haute',
            direction='Finance',
            resume='Résumé test',
            numeroFacture='FAC-DEL-001',
            compteCharge='CC-001',
            dateReception='2026-08-10',
            modeReception='Email',
            piecesJointes=[],
            actor='Utilisateur test',
            role='utilisateur',
        )
    )

    next_factures = service.delete_facture(created.id)

    assert not any(facture.id == created.id for facture in next_factures)


def test_delete_supply_ticket_removes_it_from_state(tmp_path):
    store = JsonStore(path=tmp_path / 'db.json')
    service = BackendService(store=store)

    created = service.create_supply_ticket(
        SupplyTicketCreate(
            direction='Operations',
            objet='Ticket a supprimer',
            montant=1500,
            devise='XAF',
            direction_demandeur='Operations',
            budget_previsionnel=1500,
            actor='Demandeur test',
        )
    )

    next_state = service.delete_supply_ticket(created.id)

    assert not any(ticket.id == created.id for ticket in next_state.tickets)
