from app.schemas import FactureCreate, FactureStatusUpdate
from app.services import BackendService
from app.storage import JsonStore


def test_create_facture_starts_at_verification_metier(tmp_path):
    store = JsonStore(path=tmp_path / 'db.json')
    service = BackendService(store=store)

    created = service.create_facture(
        FactureCreate(
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

    assert created.statut == 'Vérification métier'


def test_update_facture_status_stores_comment_and_attachments(tmp_path):
    store = JsonStore(path=tmp_path / 'db.json')
    service = BackendService(store=store)

    created = service.create_facture(
        FactureCreate(
            fournisseur='Fournisseur test',
            montant=1250,
            devise='XAF',
            centreCout='CC-001',
            description='Demande de test',
            echeance='2026-08-15',
            priorite='Haute',
            direction='Finance',
            resume='Résumé de test',
            numeroFacture='FAC-002',
            compteCharge='CC-001',
            dateReception='2026-08-10',
            modeReception='Email',
            piecesJointes=['facture.pdf'],
            actor='Utilisateur test',
            role='utilisateur',
        )
    )

    updated = service.update_facture_status(
        created.id,
        FactureStatusUpdate(
            next_status='Validation N+1',
            actor='Manager test',
            role='manageur',
            action_label='Valider la vérification métier',
            commentaire='Dossier complet',
            piecesJointes=['note-interne.pdf'],
        ),
    )

    assert updated.statut == 'Validation N+1'
    assert updated.history[0].commentaire == 'Dossier complet'
    assert updated.history[0].piecesJointes == ['note-interne.pdf']
