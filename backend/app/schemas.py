from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator


class HistoryEntry(BaseModel):
    id: str | None = None
    at: str
    actor: str
    action: str
    role: str | None = None
    detail: str | None = None


class Invoice(BaseModel):
    id: str
    fournisseur: str
    montant: float
    devise: str
    centreCout: str
    description: str
    echeance: str
    statut: str
    history: list[HistoryEntry] = Field(default_factory=list)


class InvoiceCreate(BaseModel):
    fournisseur: str
    montant: float
    devise: str = "EUR"
    centreCout: str
    description: str
    echeance: str
    actor: str = "Systeme"
    role: str = "utilisateur"


class InvoiceStatusUpdate(BaseModel):
    next_status: str
    actor: str = "Systeme Workflow"
    role: str = "utilisateur"
    action_label: str | None = None


class BudgetLine(BaseModel):
    direction: str
    allocated: float
    engaged: float
    allocatedBy: str


class User(BaseModel):
    id: str
    username: str
    full_name: str
    email: str | None = None
    role: str
    roles: list[str] = Field(default_factory=list)
    password_hash: str
    is_active: bool = True

    @model_validator(mode="after")
    def normalize_roles(self):
        normalized_roles = [role for role in self.roles if role]
        if not normalized_roles and self.role:
            normalized_roles = [self.role]
        if self.role and self.role not in normalized_roles:
            normalized_roles.insert(0, self.role)
        if normalized_roles:
            self.role = normalized_roles[0]
        self.roles = list(dict.fromkeys(normalized_roles))
        return self


class AuthUserSummary(BaseModel):
    id: str
    username: str
    full_name: str
    email: str | None = None
    role: str
    roles: list[str] = Field(default_factory=list)
    is_active: bool = True

    @model_validator(mode="after")
    def normalize_roles(self):
        normalized_roles = [role for role in self.roles if role]
        if not normalized_roles and self.role:
            normalized_roles = [self.role]
        if self.role and self.role not in normalized_roles:
            normalized_roles.insert(0, self.role)
        if normalized_roles:
            self.role = normalized_roles[0]
        self.roles = list(dict.fromkeys(normalized_roles))
        return self


class AuthLoginRequest(BaseModel):
    username: str
    password: str


class RoleDefinition(BaseModel):
    code: str
    label: str


class RoleUpdateRequest(BaseModel):
    label: str


class DirectionDefinition(BaseModel):
    name: str


class WorkflowStepAssignment(BaseModel):
    step: str
    user_ids: list[str] = Field(default_factory=list)
    workflow_type: str = "facturation"


class UserCreateRequest(BaseModel):
    username: str
    password: str
    full_name: str
    role: str
    roles: list[str] = Field(default_factory=list)
    email: str | None = None

    @model_validator(mode="after")
    def normalize_roles(self):
        normalized_roles = [role for role in self.roles if role]
        if not normalized_roles and self.role:
            normalized_roles = [self.role]
        if self.role and self.role not in normalized_roles:
            normalized_roles.insert(0, self.role)
        if normalized_roles:
            self.role = normalized_roles[0]
        self.roles = list(dict.fromkeys(normalized_roles))
        return self


class UserUpdateRequest(BaseModel):
    full_name: str
    role: str
    roles: list[str] = Field(default_factory=list)
    email: str | None = None
    is_active: bool = True

    @model_validator(mode="after")
    def normalize_roles(self):
        normalized_roles = [role for role in self.roles if role]
        if not normalized_roles and self.role:
            normalized_roles = [self.role]
        if self.role and self.role not in normalized_roles:
            normalized_roles.insert(0, self.role)
        if normalized_roles:
            self.role = normalized_roles[0]
        self.roles = list(dict.fromkeys(normalized_roles))
        return self


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: AuthUserSummary


class BudgetUpsert(BaseModel):
    direction: str
    allocated: float
    engaged: float
    allocatedBy: str = "DirFin"
    actor: str = "DirFin"


class SupplyTicket(BaseModel):
    id: str
    direction: str
    objet: str
    montant: float
    devise: str
    statut: str
    linkedInvoiceId: str = ""
    history: list[HistoryEntry] = Field(default_factory=list)


class SupplyTicketCreate(BaseModel):
    direction: str
    objet: str
    montant: float
    devise: str = "EUR"
    actor: str = "Demandeur"


class DirfinHistoryEntry(BaseModel):
    id: str
    at: str
    actor: str
    action: str
    detail: str = ""


class ApproState(BaseModel):
    budgets: list[BudgetLine]
    tickets: list[SupplyTicket]
    dirfinHistory: list[DirfinHistoryEntry] = Field(default_factory=list)


class Metric(BaseModel):
    label: str
    value: str
    trend: str
    tone: str


class Mission(BaseModel):
    code: str
    collaborateur: str
    destination: str
    frais: str
    statut: str


class TraceEvent(BaseModel):
    date: str
    action: str
    actor: str


class BudgetOverview(BaseModel):
    poste: str
    consomme: int
    plafond: str
    tendance: str


class DashboardPayload(BaseModel):
    kpi_metrics: list[Metric]
    missions: list[Mission]
    trace_events: list[TraceEvent]
    budget_lines: list[BudgetOverview]


class WorkflowMetadata(BaseModel):
    invoice_statuses: list[str]
    user_roles: list[str]
    role_labels: dict[str, str]
    directions: list[str] = Field(default_factory=list)
    workflow_steps: list[str] = Field(default_factory=list)
    workflow_assignments: list[WorkflowStepAssignment] = Field(default_factory=list)
    appro_statuses: list[str] = Field(default_factory=list)
    facturation_statuses: list[str] = Field(default_factory=list)


class TicketActionResponse(BaseModel):
    state: ApproState
    invoiceId: str = ""
    error: str = ""


class DeleteBudgetResponse(BaseModel):
    state: ApproState
    error: str = ""


class HealthResponse(BaseModel):
    status: Literal["ok"]


class ErrorResponse(BaseModel):
    detail: str


class AppState(BaseModel):
    model_config = ConfigDict(extra="forbid")

    invoices: list[Invoice]
    appro: ApproState
    kpi_metrics: list[Metric]
    missions: list[Mission]
    trace_events: list[TraceEvent]
    budget_lines: list[BudgetOverview]
    invoice_statuses: list[str]
    user_roles: list[str]
    role_labels: dict[str, str]
    directions: list[str] = Field(default_factory=list)
    workflow_assignments: list[WorkflowStepAssignment] = Field(default_factory=list)
    users: list[User] = Field(default_factory=list)
    appro_statuses: list[str] = Field(default_factory=list)
    facturation_statuses: list[str] = Field(default_factory=list)