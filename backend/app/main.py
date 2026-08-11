from fastapi import Depends, FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from .auth import decode_token
from .config import CORS_ORIGINS
from .schemas import (
    ApproState,
    AuthLoginRequest,
    AuthUserSummary,
    BudgetUpsert,
    DashboardPayload,
    DeleteBudgetResponse,
    DirectionDefinition,
    HealthResponse,
    Invoice,
    InvoiceCreate,
    InvoiceStatusUpdate,
    RoleDefinition,
    RoleUpdateRequest,
    SupplyTicket,
    SupplyTicketCreate,
    TokenResponse,
    UserCreateRequest,
    UserUpdateRequest,
    WorkflowMetadata,
    WorkflowStepAssignment,
)
from .services import BackendService


app = FastAPI(
    title="Facturation API",
    version="1.0.0",
    description="Backend FastAPI pour le suivi des factures, budgets et tickets approvisionnement.",
    openapi_tags=[
        {"name": "Health", "description": "Vérification de l'état du backend."},
        {"name": "Auth", "description": "Authentification, tableau de bord et profil utilisateur."},
        {"name": "Administration", "description": "Gestion des rôles, utilisateurs, directions et assignations de workflow."},
        {"name": "Workflow", "description": "Métadonnées et configuration des workflows."},
        {"name": "Invoices", "description": "Gestion du cycle de vie des factures."},
        {"name": "Approvisionnement", "description": "Gestion des budgets, tickets et transferts approvisionnement."},
    ],
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

service = BackendService()
security = HTTPBearer(auto_error=False)


def get_current_user(credentials: HTTPAuthorizationCredentials | None = Depends(security)) -> AuthUserSummary:
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token manquant.")

    try:
        decode_token(credentials.credentials)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token invalide.") from exc

    return service.get_current_user(credentials.credentials)


def require_admin(user: AuthUserSummary = Depends(get_current_user)) -> AuthUserSummary:
    if user.role not in {"admin", "administrateur"}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès administrateur requis.")
    return user


@app.get("/health", response_model=HealthResponse, tags=["Health"])
def healthcheck() -> HealthResponse:
    return HealthResponse.model_validate(service.get_health())


@app.get("/api/dashboard", response_model=DashboardPayload, tags=["Auth"])
def get_dashboard(user: AuthUserSummary = Depends(get_current_user)) -> DashboardPayload:
    return DashboardPayload.model_validate(service.get_dashboard())


@app.post("/api/auth/login", response_model=TokenResponse, tags=["Auth"])
def login(payload: AuthLoginRequest) -> TokenResponse:
    return service.login(payload)


@app.get("/api/auth/me", response_model=AuthUserSummary, tags=["Auth"])
def me(user: AuthUserSummary = Depends(get_current_user)) -> AuthUserSummary:
    return user


@app.get("/api/admin/roles", response_model=list[RoleDefinition], tags=["Administration"])
def list_roles(user: AuthUserSummary = Depends(require_admin)) -> list[RoleDefinition]:
    return service.list_roles()


@app.post("/api/admin/roles", response_model=list[RoleDefinition], tags=["Administration"])
def create_role(payload: RoleDefinition, user: AuthUserSummary = Depends(require_admin)) -> list[RoleDefinition]:
    return service.create_role(payload.code, payload.label)


@app.put("/api/admin/roles/{role_code}", response_model=list[RoleDefinition], tags=["Administration"])
def update_role(role_code: str, payload: RoleUpdateRequest, user: AuthUserSummary = Depends(require_admin)) -> list[RoleDefinition]:
    return service.update_role(role_code, payload)


@app.delete("/api/admin/roles/{role_code}", response_model=list[RoleDefinition], tags=["Administration"])
def delete_role(role_code: str, user: AuthUserSummary = Depends(require_admin)) -> list[RoleDefinition]:
    return service.delete_role(role_code)


@app.get("/api/admin/users", response_model=list[AuthUserSummary], tags=["Administration"])
def list_admin_users(user: AuthUserSummary = Depends(require_admin)) -> list[AuthUserSummary]:
    return service.list_users()


@app.post("/api/admin/users", response_model=AuthUserSummary, tags=["Administration"])
def create_admin_user(payload: UserCreateRequest, user: AuthUserSummary = Depends(require_admin)) -> AuthUserSummary:
    return service.create_user_record(payload.username, payload.password, payload.full_name, payload.role, payload.email, payload.roles)


@app.put("/api/admin/users/{user_id}", response_model=AuthUserSummary, tags=["Administration"])
def update_admin_user(user_id: str, payload: UserUpdateRequest, user: AuthUserSummary = Depends(require_admin)) -> AuthUserSummary:
    return service.update_user(user_id, payload)


@app.delete("/api/admin/users/{user_id}", response_model=bool, tags=["Administration"])
def delete_admin_user(user_id: str, user: AuthUserSummary = Depends(require_admin)) -> bool:
    return service.delete_user(user_id)


@app.get("/api/admin/directions", response_model=list[DirectionDefinition], tags=["Administration"])
def list_directions(user: AuthUserSummary = Depends(require_admin)) -> list[DirectionDefinition]:
    return service.list_directions()


@app.post("/api/admin/directions", response_model=list[DirectionDefinition], tags=["Administration"])
def create_direction(payload: DirectionDefinition, user: AuthUserSummary = Depends(require_admin)) -> list[DirectionDefinition]:
    return service.create_direction(payload.name)


@app.put("/api/admin/directions/{direction_name}", response_model=list[DirectionDefinition], tags=["Administration"])
def update_direction(direction_name: str, payload: DirectionDefinition, user: AuthUserSummary = Depends(require_admin)) -> list[DirectionDefinition]:
    return service.update_direction(direction_name, payload.name)


@app.delete("/api/admin/directions/{direction_name}", response_model=list[DirectionDefinition], tags=["Administration"])
def delete_direction(direction_name: str, user: AuthUserSummary = Depends(require_admin)) -> list[DirectionDefinition]:
    return service.delete_direction(direction_name)


@app.get("/api/admin/workflow-assignments", response_model=list[WorkflowStepAssignment], tags=["Administration"])
def list_workflow_assignments(user: AuthUserSummary = Depends(require_admin)) -> list[WorkflowStepAssignment]:
    return service.list_workflow_assignments()


@app.post("/api/admin/workflow-assignments", response_model=WorkflowStepAssignment, tags=["Administration"])
def save_workflow_assignment(payload: WorkflowStepAssignment, user: AuthUserSummary = Depends(require_admin)) -> WorkflowStepAssignment:
    return service.save_workflow_assignment(payload.step, payload.user_ids, payload.workflow_type)


@app.put("/api/admin/workflow-assignments/{step}", response_model=WorkflowStepAssignment, tags=["Administration"])
def update_workflow_assignment(step: str, payload: WorkflowStepAssignment, user: AuthUserSummary = Depends(require_admin)) -> WorkflowStepAssignment:
    return service.save_workflow_assignment(step, payload.user_ids, payload.workflow_type)


@app.delete("/api/admin/workflow-assignments/{step}", response_model=list[WorkflowStepAssignment], tags=["Administration"])
def delete_workflow_assignment(step: str, workflow_type: str = Query(default="facturation"), user: AuthUserSummary = Depends(require_admin)) -> list[WorkflowStepAssignment]:
    return service.delete_workflow_assignment(step, workflow_type)


@app.get("/api/meta/workflow", response_model=WorkflowMetadata, tags=["Workflow"])
def get_workflow(user: AuthUserSummary = Depends(get_current_user)) -> WorkflowMetadata:
    return service.get_workflow_metadata()


@app.get("/api/invoices", response_model=list[Invoice], tags=["Invoices"])
def list_invoices(user: AuthUserSummary = Depends(get_current_user)) -> list[Invoice]:
    return service.list_invoices()


@app.get("/api/invoices/{invoice_id}", response_model=Invoice, tags=["Invoices"])
def get_invoice(invoice_id: str, user: AuthUserSummary = Depends(get_current_user)) -> Invoice:
    return service.get_invoice(invoice_id)


@app.post("/api/invoices", response_model=Invoice, status_code=201, tags=["Invoices"])
def create_invoice(payload: InvoiceCreate, user: AuthUserSummary = Depends(get_current_user)) -> Invoice:
    return service.create_invoice(payload)


@app.patch("/api/invoices/{invoice_id}/status", response_model=Invoice, tags=["Invoices"])
def update_invoice_status(invoice_id: str, payload: InvoiceStatusUpdate, user: AuthUserSummary = Depends(get_current_user)) -> Invoice:
    return service.update_invoice_status(invoice_id, payload)


@app.get("/api/appro", response_model=ApproState, tags=["Approvisionnement"])
def get_appro(user: AuthUserSummary = Depends(get_current_user)) -> ApproState:
    return service.get_appro_state()


@app.post("/api/appro/budgets", response_model=ApproState, tags=["Approvisionnement"])
def save_direction_budget(payload: BudgetUpsert, user: AuthUserSummary = Depends(get_current_user)) -> ApproState:
    return service.save_direction_budget(payload)


@app.delete("/api/appro/budgets/{direction_name}", response_model=DeleteBudgetResponse, tags=["Approvisionnement"])
def delete_direction_budget(direction_name: str, actor: str = Query(default="DirFin"), user: AuthUserSummary = Depends(get_current_user)) -> DeleteBudgetResponse:
    return service.delete_direction_budget(direction_name, actor)


@app.post("/api/appro/tickets", response_model=SupplyTicket, status_code=201, tags=["Approvisionnement"])
def create_supply_ticket(payload: SupplyTicketCreate, user: AuthUserSummary = Depends(get_current_user)) -> SupplyTicket:
    return service.create_supply_ticket(payload)


@app.post("/api/appro/tickets/{ticket_id}/verify", response_model=ApproState, tags=["Approvisionnement"])
def verify_ticket(ticket_id: str, actor: str = Query(default="Agent Approvisionnement"), user: AuthUserSummary = Depends(get_current_user)) -> ApproState:
    return service.verify_ticket_budget(ticket_id, actor)


@app.post("/api/appro/tickets/{ticket_id}/close", response_model=ApproState, tags=["Approvisionnement"])
def close_ticket(ticket_id: str, actor: str = Query(default="Agent Approvisionnement"), user: AuthUserSummary = Depends(get_current_user)) -> ApproState:
    return service.close_ticket(ticket_id, actor)