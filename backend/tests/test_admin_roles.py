from app.services import BackendService
from app.schemas import RoleUpdateRequest, UserUpdateRequest
from app.storage import JsonStore

# Local-only fixture credential for tests, never used outside tmp_path stores.
TEST_USER_PASSWORD = "test-fixture-pw-1"


def test_create_and_delete_role_and_user(tmp_path):
    store = JsonStore(path=tmp_path / "db.json")
    service = BackendService(store=store)

    roles = service.create_role("appro", "Approvisionnement")
    assert any(role.code == "appro" for role in roles)

    updated_roles = service.update_role("appro", payload=RoleUpdateRequest(label="Appro central"))
    assert any(role.code == "appro" and role.label == "Appro central" for role in updated_roles)

    created_user = service.create_user_record(
        username="demoappro",
        password=TEST_USER_PASSWORD,
        full_name="Demo Appro",
        role="appro",
        email="demoappro@example.com",
    )
    assert created_user.username == "demoappro"

    updated_user = service.update_user(
        created_user.id,
        payload=UserUpdateRequest(
            full_name="Demo Appro Modifie",
            role="appro",
            email="demoappro+2@example.com",
            is_active=True,
        ),
    )
    assert updated_user.full_name == "Demo Appro Modifie"

    users = service.list_users()
    assert any(user.username == "demoappro" for user in users)

    deleted_roles = service.delete_role("appro")
    assert not any(role.code == "appro" for role in deleted_roles)

    deleted_user = service.delete_user(created_user.id)
    assert deleted_user is True


def test_create_update_delete_direction(tmp_path):
    store = JsonStore(path=tmp_path / "db.json")
    service = BackendService(store=store)

    created = service.create_direction("Juridique")
    assert any(direction.name == "Juridique" for direction in created)

    updated = service.update_direction("Juridique", "Affaires Juridiques")
    assert any(direction.name == "Affaires Juridiques" for direction in updated)

    deleted = service.delete_direction("Affaires Juridiques")
    assert not any(direction.name == "Affaires Juridiques" for direction in deleted)
