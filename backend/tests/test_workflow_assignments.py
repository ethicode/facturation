from app.services import BackendService
from app.storage import JsonStore


def test_workflow_assignment_can_be_created_and_removed(tmp_path):
    store = JsonStore(path=tmp_path / "db.json")
    service = BackendService(store=store)

    created_user = service.create_user_record(
        username="ladstep",
        password="ladstep123",
        full_name="LAD Step",
        role="utilisateur",
        email="ladstep@example.com",
    )

    assignment = service.save_workflow_assignment("Saisie de la demande", [created_user.id])
    assert assignment.step == "Saisie de la demande"
    assert assignment.user_ids == [created_user.id]

    metadata = service.get_workflow_metadata()
    assert any(item.step == "Saisie de la demande" for item in metadata.workflow_assignments)

    removed_assignments = service.delete_workflow_assignment("Saisie de la demande")
    assert not any(item.step == "Saisie de la demande" for item in removed_assignments)
