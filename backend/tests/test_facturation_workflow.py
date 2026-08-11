from app.schemas import InvoiceCreate
from app.services import BackendService
from app.storage import JsonStore


def test_create_invoice_sets_pending_status_for_next_workflow_step(tmp_path):
    store = JsonStore(path=tmp_path / 'db.json')
    service = BackendService(store=store)

    created = service.create_invoice(
        InvoiceCreate(
            fournisseur='Fournisseur test',
            montant=1250,
            devise='XAF',
            centreCout='CC-001',
            description='Demande de test',
            echeance='2026-08-15',
            priorite='Haute',
            direction='Finance',
            resume='Résumé de test',
            numeroFacture='FAC-001',
            compteCharge='CC-001',
            dateReception='2026-08-10',
            modeReception='Email',
            piecesJointes=[],
            actor='Utilisateur test',
            role='utilisateur',
        )
    )

    assert created.statut == 'En attente de vérification métier'
