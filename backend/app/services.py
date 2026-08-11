from __future__ import annotations

from copy import deepcopy
from datetime import datetime, timezone
from random import randint

from fastapi import HTTPException

from .auth import create_token, decode_token, hash_password, verify_password
from .schemas import (
    AppState,
    ApproState,
    AuthLoginRequest,
    AuthUserSummary,
    BudgetUpsert,
    DeleteBudgetResponse,
    DirectionDefinition,
    DirfinHistoryEntry,
    Invoice,
    InvoiceCreate,
    InvoiceStatusUpdate,
    RoleDefinition,
    RoleUpdateRequest,
    SupplyTicket,
    SupplyTicketCreate,
    TicketActionResponse,
    TokenResponse,
    User,
    UserCreateRequest,
    UserUpdateRequest,
    WorkflowMetadata,
    WorkflowStepAssignment,
)
from .seed_data import SEED_DATA
from .storage import JsonStore


class BackendService:
    def __init__(self, store: JsonStore | None = None):
        self.store = store or JsonStore()

    def _state_with_seed(self) -> AppState:
        state = self.store.read()
        seed_state = AppState.model_validate(deepcopy(SEED_DATA))

        if not state.users or not state.user_roles:
            state.users = seed_state.users
            state.role_labels = seed_state.role_labels
            state.user_roles = seed_state.user_roles
            self.store.write(state)
            return state

        missing_roles = [role for role in seed_state.user_roles if role not in state.user_roles]
        if missing_roles:
            state.user_roles = list(dict.fromkeys([*state.user_roles, *missing_roles]))
        for role_code, label in seed_state.role_labels.items():
            state.role_labels.setdefault(role_code, label)

        existing_usernames = {user.username.lower() for user in state.users}
        for seed_user in seed_state.users:
            if seed_user.username.lower() not in existing_usernames:
                state.users.append(seed_user)
                existing_usernames.add(seed_user.username.lower())

        if not state.directions:
            state.directions = seed_state.directions or [line.direction for line in state.appro.budgets]

        if not state.workflow_assignments:
            state.workflow_assignments = seed_state.workflow_assignments

        if not state.appro_statuses:
            state.appro_statuses = seed_state.appro_statuses

        if not state.facturation_statuses:
            state.facturation_statuses = seed_state.facturation_statuses

        # keep invoice_statuses in sync with facturation_statuses
        if state.facturation_statuses and state.invoice_statuses != state.facturation_statuses:
            state.invoice_statuses = state.facturation_statuses

        self.store.write(state)
        return state

    def get_health(self) -> dict[str, str]:
        return {"status": "ok"}

    def get_dashboard(self) -> dict:
        state = self._state_with_seed()
        return {
            "kpi_metrics": state.kpi_metrics,
            "missions": state.missions,
            "trace_events": state.trace_events,
            "budget_lines": state.budget_lines,
        }

    def get_workflow_metadata(self) -> WorkflowMetadata:
        state = self._state_with_seed()
        return WorkflowMetadata(
            invoice_statuses=state.invoice_statuses,
            user_roles=state.user_roles,
            role_labels=state.role_labels,
            directions=state.directions,
            workflow_steps=state.invoice_statuses,
            workflow_assignments=state.workflow_assignments,
            appro_statuses=state.appro_statuses,
            facturation_statuses=state.facturation_statuses,
        )

    def list_directions(self) -> list[DirectionDefinition]:
        state = self._state_with_seed()
        return [DirectionDefinition(name=name) for name in state.directions]

    def create_direction(self, name: str) -> list[DirectionDefinition]:
        state = self._state_with_seed()
        normalized = name.strip()
        if not normalized:
            raise HTTPException(status_code=400, detail="Le nom de la direction est obligatoire.")
        if any(item.lower() == normalized.lower() for item in state.directions):
            raise HTTPException(status_code=409, detail="Cette direction existe déjà.")

        state.directions.append(normalized)
        self.store.write(state)
        return [DirectionDefinition(name=item) for item in state.directions]

    def update_direction(self, current_name: str, next_name: str) -> list[DirectionDefinition]:
        state = self._state_with_seed()
        current = current_name.strip()
        next_value = next_name.strip()
        if not current or not next_value:
            raise HTTPException(status_code=400, detail="Le nom de direction est obligatoire.")

        index = next((idx for idx, item in enumerate(state.directions) if item.lower() == current.lower()), None)
        if index is None:
            raise HTTPException(status_code=404, detail="Direction introuvable.")
        if current.lower() != next_value.lower() and any(item.lower() == next_value.lower() for item in state.directions):
            raise HTTPException(status_code=409, detail="Une direction avec ce nom existe déjà.")

        state.directions[index] = next_value
        for budget in state.appro.budgets:
            if budget.direction.lower() == current.lower():
                budget.direction = next_value
        for ticket in state.appro.tickets:
            if ticket.direction.lower() == current.lower():
                ticket.direction = next_value

        self.store.write(state)
        return [DirectionDefinition(name=item) for item in state.directions]

    def delete_direction(self, name: str) -> list[DirectionDefinition]:
        state = self._state_with_seed()
        normalized = name.strip()
        if not normalized:
            raise HTTPException(status_code=400, detail="Le nom de direction est obligatoire.")
        if not any(item.lower() == normalized.lower() for item in state.directions):
            raise HTTPException(status_code=404, detail="Direction introuvable.")

        if any(budget.direction.lower() == normalized.lower() for budget in state.appro.budgets):
            raise HTTPException(status_code=400, detail="Supprimez d'abord le budget lié à cette direction.")
        if any(ticket.direction.lower() == normalized.lower() for ticket in state.appro.tickets):
            raise HTTPException(status_code=400, detail="Supprimez d'abord les tickets liés à cette direction.")

        state.directions = [item for item in state.directions if item.lower() != normalized.lower()]
        self.store.write(state)
        return [DirectionDefinition(name=item) for item in state.directions]

    def list_invoices(self) -> list[Invoice]:
        return self._state_with_seed().invoices

    def get_invoice(self, invoice_id: str) -> Invoice:
        state = self._state_with_seed()
        invoice = next((item for item in state.invoices if item.id == invoice_id), None)
        if invoice is None:
            raise HTTPException(status_code=404, detail="Facture introuvable.")
        return invoice

    def create_invoice(self, payload: InvoiceCreate) -> Invoice:
        state = self._state_with_seed()
        reception_date = payload.dateReception or payload.echeance
        charge_account = payload.compteCharge or payload.centreCout
        invoice = Invoice(
            id=self._create_invoice_reference(state.invoices),
            fournisseur=payload.fournisseur,
            montant=payload.montant,
            devise=payload.devise,
            centreCout=charge_account,
            description=payload.description,
            echeance=reception_date,
            priorite=payload.priorite,
            direction=payload.direction,
            resume=payload.resume,
            numeroFacture=payload.numeroFacture,
            compteCharge=charge_account,
            dateReception=reception_date,
            modeReception=payload.modeReception,
            piecesJointes=payload.piecesJointes,
            statut="Initialisation",
            history=[
                {
                    "at": self._now_iso(),
                    "actor": payload.actor,
                    "role": payload.role,
                    "action": "Facture creee",
                }
            ],
        )
        state.invoices = [invoice, *state.invoices]
        self.store.write(state)
        return invoice

    def update_invoice_status(self, invoice_id: str, payload: InvoiceStatusUpdate) -> Invoice:
        state = self._state_with_seed()
        invoice = next((item for item in state.invoices if item.id == invoice_id), None)
        if invoice is None:
            raise HTTPException(status_code=404, detail="Facture introuvable.")

        invoice.statut = payload.next_status
        invoice.history = [
            {
                "at": self._now_iso(),
                "actor": payload.actor,
                "role": payload.role,
                "action": payload.action_label or f"Statut passe a {payload.next_status}",
            },
            *invoice.history,
        ]
        self.store.write(state)
        return invoice

    def get_appro_state(self) -> ApproState:
        return self._state_with_seed().appro

    def save_direction_budget(self, payload: BudgetUpsert) -> ApproState:
        state = self._state_with_seed()
        direction_name = payload.direction.strip()
        existing = next((line for line in state.appro.budgets if line.direction == direction_name), None)

        budget_entry = {
            "direction": direction_name,
            "allocated": payload.allocated,
            "engaged": payload.engaged,
            "allocatedBy": payload.allocatedBy,
        }

        if existing is None:
            state.appro.budgets = [budget_entry, *state.appro.budgets]
            detail = (
                f"Allocation initiale pour {direction_name}: "
                f"{budget_entry['allocated']} alloue, {budget_entry['engaged']} engage"
            )
            action = "Nouvelle allocation budgetaire creee"
        else:
            state.appro.budgets = [
                budget_entry if line.direction == direction_name else line for line in state.appro.budgets
            ]
            detail = (
                f"Direction {direction_name}: {existing.allocated} -> {payload.allocated}; "
                f"engage {existing.engaged} -> {payload.engaged}"
            )
            action = "Allocation budgetaire mise a jour"

        state.appro.dirfinHistory = [
            self._dirfin_event(payload.actor, action, detail),
            *state.appro.dirfinHistory,
        ]
        self.store.write(state)
        return state.appro

    def delete_direction_budget(self, direction_name: str, actor: str = "DirFin") -> DeleteBudgetResponse:
        state = self._state_with_seed()
        linked_tickets = any(ticket.direction == direction_name for ticket in state.appro.tickets)
        if linked_tickets:
            return DeleteBudgetResponse(
                state=state.appro,
                error="Impossible de supprimer: des tickets approvisionnement sont lies a cette direction.",
            )

        state.appro.budgets = [line for line in state.appro.budgets if line.direction != direction_name]
        state.appro.dirfinHistory = [
            self._dirfin_event(actor, "Allocation budgetaire supprimee", f"Suppression de {direction_name}"),
            *state.appro.dirfinHistory,
        ]
        self.store.write(state)
        return DeleteBudgetResponse(state=state.appro, error="")

    def create_supply_ticket(self, payload: SupplyTicketCreate) -> SupplyTicket:
        state = self._state_with_seed()
        direction_value = payload.direction_demandeur or payload.direction
        title_value = payload.titre_demande or payload.objet
        amount_value = payload.budget_previsionnel if payload.budget_previsionnel > 0 else payload.montant

        if not direction_value or not title_value or amount_value <= 0:
            raise HTTPException(status_code=400, detail="Champs obligatoires invalides pour le ticket approvisionnement.")

        ticket = SupplyTicket(
            id=self._create_ticket_reference(state.appro.tickets),
            direction=direction_value,
            objet=title_value,
            montant=amount_value,
            devise=payload.devise,
            titre_demande=payload.titre_demande,
            domaine=payload.domaine,
            sous_domaine=payload.sous_domaine,
            action_demande=payload.action_demande,
            date_debut_souhaitee=payload.date_debut_souhaitee,
            date_fin_souhaitee=payload.date_fin_souhaitee,
            direction_demandeur=direction_value,
            budget_previsionnel=amount_value,
            priorite=payload.priorite,
            description=payload.description,
            commentaire=payload.commentaire,
            fichier_nom=payload.fichier_nom,
            statut="Initialisation",
            linkedInvoiceId="",
            history=[
                {
                    "id": self._event_id(),
                    "at": self._now_iso(),
                    "actor": payload.actor,
                    "action": "Ticket cree en approvisionnement",
                }
            ],
        )
        state.appro.tickets = [ticket, *state.appro.tickets]
        self.store.write(state)
        return ticket

    def verify_ticket_budget(self, ticket_id: str, actor: str = "Agent Approvisionnement") -> ApproState:
        state = self._state_with_seed()
        ticket = self._find_ticket(state, ticket_id)
        budget = next((line for line in state.appro.budgets if line.direction == ticket.direction), None)
        if budget is None:
            return state.appro

        remaining = budget.allocated - budget.engaged
        is_valid = remaining >= ticket.montant
        if is_valid:
            budget.engaged += ticket.montant

        ticket.statut = "En cours" if is_valid else "En attente de prise en charge"
        ticket.history = [
            {
                "id": self._event_id(),
                "at": self._now_iso(),
                "actor": actor,
                "action": (
                    "Ticket pris en charge - traitement en cours"
                    if is_valid
                    else "Budget insuffisant - en attente de prise en charge"
                ),
            },
            *ticket.history,
        ]
        self.store.write(state)
        return state.appro

    def transfer_ticket_to_invoicing(
        self,
        ticket_id: str,
        actor: str = "Agent Approvisionnement",
    ) -> TicketActionResponse:
        state = self._state_with_seed()
        ticket = self._find_ticket(state, ticket_id)
        if ticket.statut == "Clôturée" or ticket.linkedInvoiceId:
            return TicketActionResponse(state=state.appro, invoiceId=ticket.linkedInvoiceId, error="")

        budget = next((line for line in state.appro.budgets if line.direction == ticket.direction), None)
        if budget is None:
            return TicketActionResponse(state=state.appro, invoiceId="", error="Aucun budget trouve pour cette direction.")

        remaining = budget.allocated - budget.engaged
        if remaining < ticket.montant:
            ticket.statut = "En attente de prise en charge"
            ticket.history = [
                {
                    "id": self._event_id(),
                    "at": self._now_iso(),
                    "actor": actor,
                    "action": "Transfert refuse: budget insuffisant",
                },
                *ticket.history,
            ]
            self.store.write(state)
            return TicketActionResponse(
                state=state.appro,
                invoiceId="",
                error="Budget insuffisant pour envoyer ce ticket en facturation.",
            )

        should_increment_budget = ticket.statut != "En cours"
        if should_increment_budget:
            budget.engaged += ticket.montant
        next_invoice_id = self._create_invoice_reference(state.invoices)
        new_invoice = Invoice(
            id=next_invoice_id,
            fournisseur=f"Ticket {ticket.id}",
            montant=ticket.montant,
            devise=ticket.devise,
            centreCout=ticket.direction.upper(),
            description=f"Issue approvisionnement: {ticket.objet}",
            echeance=self._today(),
            statut="Initialisation",
            history=[
                {
                    "at": self._now_iso(),
                    "actor": actor,
                    "role": "utilisateur",
                    "action": f"Facture creee depuis {ticket.id}",
                }
            ],
        )
        state.invoices = [new_invoice, *state.invoices]
        ticket.statut = "Transférée en facturation"
        ticket.linkedInvoiceId = next_invoice_id
        ticket.history = [
            {
                "id": self._event_id(),
                "at": self._now_iso(),
                "actor": actor,
                "action": f"Ticket envoye vers facturation ({next_invoice_id})",
            },
            *ticket.history,
        ]
        self.store.write(state)
        return TicketActionResponse(state=state.appro, invoiceId=next_invoice_id, error="")

    def close_ticket(self, ticket_id: str, actor: str = "Agent Approvisionnement") -> ApproState:
        state = self._state_with_seed()
        ticket = self._find_ticket(state, ticket_id)
        if ticket.statut == "Clôturée" or ticket.linkedInvoiceId:
            return state.appro

        ticket.statut = "Clôturée"
        ticket.history = [
            {
                "id": self._event_id(),
                "at": self._now_iso(),
                "actor": actor,
                "action": "Ticket clôturé",
            },
            *ticket.history,
        ]
        self.store.write(state)
        return state.appro

    def login(self, payload: AuthLoginRequest) -> TokenResponse:
        state = self._state_with_seed()
        user = next((item for item in state.users if item.username.lower() == payload.username.lower()), None)
        if user is None or not user.is_active or not verify_password(payload.password, user.password_hash):
            raise HTTPException(status_code=401, detail="Identifiants invalides.")

        token = create_token(subject=user.id, username=user.username, role=user.role)
        return TokenResponse(
            access_token=token,
            user=AuthUserSummary(
                id=user.id,
                username=user.username,
                full_name=user.full_name,
                email=user.email,
                role=user.role,
                roles=user.roles,
                is_active=user.is_active,
            ),
        )

    def get_current_user(self, token: str) -> AuthUserSummary:
        try:
            claims = decode_token(token)
        except ValueError as exc:
            raise HTTPException(status_code=401, detail="Token invalide.") from exc

        state = self._state_with_seed()
        user = next((item for item in state.users if item.id == claims.get("sub") or item.username == claims.get("username")), None)
        if user is None or not user.is_active:
            raise HTTPException(status_code=401, detail="Utilisateur introuvable.")

        return AuthUserSummary(
            id=user.id,
            username=user.username,
            full_name=user.full_name,
            email=user.email,
            role=user.role,
            roles=user.roles,
            is_active=user.is_active,
        )

    def list_users(self) -> list[AuthUserSummary]:
        state = self._state_with_seed()
        return [
            AuthUserSummary(
                id=user.id,
                username=user.username,
                full_name=user.full_name,
                email=user.email,
                role=user.role,
                roles=user.roles,
                is_active=user.is_active,
            )
            for user in state.users
        ]

    def list_roles(self) -> list[RoleDefinition]:
        state = self._state_with_seed()
        return [
            RoleDefinition(code=code, label=state.role_labels.get(code, code))
            for code in state.user_roles
        ]

    def create_role(self, role_code: str, label: str) -> list[RoleDefinition]:
        state = self._state_with_seed()
        normalized_code = role_code.strip().lower()
        if not normalized_code or not label.strip():
            raise HTTPException(status_code=400, detail="Le code et le libellé du rôle sont obligatoires.")
        if normalized_code in state.user_roles:
            raise HTTPException(status_code=409, detail="Ce rôle existe déjà.")

        state.user_roles = [*state.user_roles, normalized_code]
        state.role_labels[normalized_code] = label.strip()
        self.store.write(state)
        return self.list_roles()

    def update_role(self, role_code: str, payload: RoleUpdateRequest) -> list[RoleDefinition]:
        state = self._state_with_seed()
        normalized_code = role_code.strip().lower()
        if normalized_code not in state.user_roles:
            raise HTTPException(status_code=404, detail="Rôle introuvable.")
        if not payload.label.strip():
            raise HTTPException(status_code=400, detail="Le libellé du rôle est obligatoire.")

        state.role_labels[normalized_code] = payload.label.strip()
        self.store.write(state)
        return self.list_roles()

    def delete_role(self, role_code: str) -> list[RoleDefinition]:
        state = self._state_with_seed()
        normalized_code = role_code.strip().lower()
        if normalized_code not in state.user_roles:
            raise HTTPException(status_code=404, detail="Rôle introuvable.")
        if normalized_code in {"admin", "administrateur"}:
            raise HTTPException(status_code=400, detail="Ce rôle ne peut pas être supprimé.")

        state.user_roles = [code for code in state.user_roles if code != normalized_code]
        state.role_labels.pop(normalized_code, None)
        updated_users = []
        for user in state.users:
            if normalized_code not in user.roles:
                updated_users.append(user)
                continue

            remaining_roles = [role for role in user.roles if role != normalized_code]
            if not remaining_roles:
                remaining_roles = ["administrateur"]

            updated_users.append(user.model_copy(update={"role": remaining_roles[0], "roles": remaining_roles}))

        state.users = updated_users
        self.store.write(state)
        return self.list_roles()

    def list_workflow_assignments(self) -> list[WorkflowStepAssignment]:
        state = self._state_with_seed()
        return state.workflow_assignments

    def save_workflow_assignment(self, step: str, user_ids: list[str], workflow_type: str = "facturation") -> WorkflowStepAssignment:
        state = self._state_with_seed()
        normalized_step = step.strip()
        normalized_type = workflow_type.strip() or "facturation"
        if not normalized_step:
            raise HTTPException(status_code=400, detail="L'étape du workflow est obligatoire.")

        all_valid_steps = state.appro_statuses + state.facturation_statuses + state.invoice_statuses
        if normalized_step not in all_valid_steps:
            raise HTTPException(status_code=400, detail="L'étape du workflow est inconnue.")

        normalized_user_ids = [user_id for user_id in user_ids if user_id]
        if normalized_user_ids:
            unknown_ids = [user_id for user_id in normalized_user_ids if not any(user.id == user_id for user in state.users)]
            if unknown_ids:
                raise HTTPException(status_code=400, detail="Un ou plusieurs identifiants utilisateur sont introuvables.")

        existing = next(
            (item for item in state.workflow_assignments if item.step == normalized_step and item.workflow_type == normalized_type),
            None,
        )
        if existing is None:
            existing = WorkflowStepAssignment(step=normalized_step, user_ids=normalized_user_ids, workflow_type=normalized_type)
            state.workflow_assignments.append(existing)
        else:
            existing.user_ids = normalized_user_ids

        self.store.write(state)
        return existing

    def delete_workflow_assignment(self, step: str, workflow_type: str = "facturation") -> list[WorkflowStepAssignment]:
        state = self._state_with_seed()
        normalized_step = step.strip()
        normalized_type = workflow_type.strip() or "facturation"
        if not normalized_step:
            raise HTTPException(status_code=400, detail="L'étape du workflow est obligatoire.")

        state.workflow_assignments = [
            item for item in state.workflow_assignments
            if not (item.step == normalized_step and item.workflow_type == normalized_type)
        ]
        self.store.write(state)
        return state.workflow_assignments

    def create_user_record(
        self,
        username: str,
        password: str,
        full_name: str,
        role: str,
        email: str | None = None,
        roles: list[str] | None = None,
    ) -> AuthUserSummary:
        state = self._state_with_seed()
        normalized_username = username.strip().lower()
        existing = next((item for item in state.users if item.username.lower() == normalized_username), None)
        if existing is not None:
            raise HTTPException(status_code=409, detail="Cet identifiant existe déjà.")

        normalized_roles = list(dict.fromkeys([*(roles or []), role]))
        invalid_roles = [item for item in normalized_roles if item not in state.user_roles]
        if invalid_roles:
            raise HTTPException(status_code=400, detail="Un ou plusieurs rôles ne sont pas connus du backend.")

        user = User(
            id=self._create_user_id(state.users),
            username=normalized_username,
            full_name=full_name.strip(),
            email=email.strip().lower() if email else None,
            role=normalized_roles[0],
            roles=normalized_roles,
            password_hash=hash_password(password),
            is_active=True,
        )
        state.users = [user, *state.users]
        self.store.write(state)
        return AuthUserSummary(
            id=user.id,
            username=user.username,
            full_name=user.full_name,
            email=user.email,
            role=user.role,
            roles=user.roles,
            is_active=user.is_active,
        )

    def update_user(self, user_id: str, payload: UserUpdateRequest) -> AuthUserSummary:
        state = self._state_with_seed()
        user = next((item for item in state.users if item.id == user_id), None)
        if user is None:
            raise HTTPException(status_code=404, detail="Utilisateur introuvable.")

        invalid_roles = [item for item in payload.roles if item not in state.user_roles]
        if invalid_roles:
            raise HTTPException(status_code=400, detail="Un ou plusieurs rôles ne sont pas connus du backend.")

        if user.username.lower() == "admin" and not payload.is_active:
            raise HTTPException(status_code=400, detail="L'administrateur principal doit rester actif.")

        user.full_name = payload.full_name.strip()
        user.email = payload.email.strip().lower() if payload.email else None
        user.role = payload.role
        user.roles = payload.roles
        user.is_active = payload.is_active

        self.store.write(state)
        return AuthUserSummary(
            id=user.id,
            username=user.username,
            full_name=user.full_name,
            email=user.email,
            role=user.role,
            roles=user.roles,
            is_active=user.is_active,
        )

    def create_user(self, username: str, password: str, full_name: str, role: str, email: str | None = None) -> AuthUserSummary:
        return self.create_user_record(username=username, password=password, full_name=full_name, role=role, email=email, roles=[role])

    def delete_user(self, user_id: str) -> bool:
        state = self._state_with_seed()
        user = next((item for item in state.users if item.id == user_id), None)
        if user is None:
            raise HTTPException(status_code=404, detail="Utilisateur introuvable.")
        if user.username.lower() == "admin":
            raise HTTPException(status_code=400, detail="L'administrateur principal ne peut pas être supprimé.")

        state.users = [item for item in state.users if item.id != user_id]
        for assignment in state.workflow_assignments:
            assignment.user_ids = [existing_id for existing_id in assignment.user_ids if existing_id != user_id]
        self.store.write(state)
        return True

    def _find_ticket(self, state: AppState, ticket_id: str) -> SupplyTicket:
        ticket = next((item for item in state.appro.tickets if item.id == ticket_id), None)
        if ticket is None:
            raise HTTPException(status_code=404, detail="Ticket introuvable.")
        return ticket

    def _create_invoice_reference(self, invoices: list[Invoice]) -> str:
        year = datetime.now(timezone.utc).year
        prefix = f"FAC-{year}-"
        max_sequence = 0
        for invoice in invoices:
            if not invoice.id.startswith(prefix):
                continue
            suffix = invoice.id.replace(prefix, "", 1)
            if suffix.isdigit():
                max_sequence = max(max_sequence, int(suffix))
        return f"{prefix}{str(max_sequence + 1).zfill(3)}"

    def _create_user_id(self, users: list[User]) -> str:
        max_sequence = 0
        for user in users:
            if not user.id.startswith("USR-"):
                continue
            suffix = user.id.replace("USR-", "", 1)
            if suffix.isdigit():
                max_sequence = max(max_sequence, int(suffix))
        return f"USR-{str(max_sequence + 1).zfill(3)}"

    def _create_ticket_reference(self, tickets: list[SupplyTicket]) -> str:
        year = datetime.now(timezone.utc).year
        prefix = f"TCK-{year}-"
        max_sequence = 0
        for ticket in tickets:
            if not ticket.id.startswith(prefix):
                continue
            suffix = ticket.id.replace(prefix, "", 1)
            if suffix.isdigit():
                max_sequence = max(max_sequence, int(suffix))
        return f"{prefix}{str(max_sequence + 1).zfill(3)}"

    def _dirfin_event(self, actor: str, action: str, detail: str) -> DirfinHistoryEntry:
        return DirfinHistoryEntry(
            id=self._event_id(),
            at=self._now_iso(),
            actor=actor,
            action=action,
            detail=detail,
        )

    def _event_id(self) -> str:
        stamp = int(datetime.now(timezone.utc).timestamp() * 1000)
        return f"{stamp}-{randint(1000, 9999)}"

    def _now_iso(self) -> str:
        return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")

    def _today(self) -> str:
        return datetime.now(timezone.utc).date().isoformat()