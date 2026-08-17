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
    Facture,
    FactureCreate,
    FactureStatusUpdate,
    HistoryEntry,
    RoleDefinition,
    RoleUpdateRequest,
    SupplyTicket,
    SupplyTicketCreate,
    TokenResponse,
    User,
    UserCreateRequest,
    UserUpdateRequest,
    WorkflowMetadata,
    WorkflowTask,
    WorkflowStepAssignment,
)
from .seed_data import SEED_DATA
from .storage import JsonStore


class BackendService:
    def __init__(self, store: JsonStore | None = None):
        self.store = store or JsonStore()

    @staticmethod
    def _normalize_facturation_statuses(statuses: list[str]) -> list[str]:
        canonical_statuses = [
            "Saisie de la demande",
            "Vérification métier",
            "Validation métier N+1",
            "Demande d'information complémentaire (Validation métier N+1)",
            "Traitement service approvisionnement",
            "Demande d'information complémentaire (Traitement service approvisionnement)",
            "Signature LAD 1",
            "Demande d'information complémentaire (Signature LAD 1)",
            "Signature LAD 2",
            "Signature LAD 3",
            "Règlement en cours",
            "Paiement effectué",
            "Rejetée",
            "Clôturée",
        ]

        normalized = []
        for status in statuses or []:
            if not status or status == "En attente de vérification métier":
                continue
            if status in {"Validation N+1", "Validation métier N+1"}:
                normalized.append("Validation métier N+1")
            elif status in {
                "Demande d'informations complémentaire",
                "Demande d'information complémentaire",
                "Demande d'information complémentaire (Validation métier N+1)",
            }:
                normalized.append("Demande d'information complémentaire (Validation métier N+1)")
            elif status in {"Validation LAD 2", "Signature LAD 2"}:
                normalized.append("Signature LAD 2")
            elif status in {"Validation LAD 3", "Signature LAD 3"}:
                normalized.append("Signature LAD 3")
            else:
                normalized.append(status)

        for status in canonical_statuses:
            if status not in normalized:
                normalized.append(status)

        return list(dict.fromkeys(normalized))

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

        users_touched = False
        for user in state.users:
            if not user.email:
                user.email = f"{user.username}@local.invalid"
                users_touched = True
            if not user.created_at:
                user.created_at = self._now_iso()
                users_touched = True
            if not user.updated_at:
                user.updated_at = user.created_at
                users_touched = True
            if not user.status:
                user.status = "active" if user.is_active else "inactive"
                users_touched = True

        if not state.directions:
            state.directions = seed_state.directions or [line.direction for line in state.appro.budgets]

        if not state.workflow_assignments:
            state.workflow_assignments = seed_state.workflow_assignments

        if not state.appro_statuses:
            state.appro_statuses = seed_state.appro_statuses

        if not state.facturation_statuses:
            state.facturation_statuses = seed_state.facturation_statuses
        state.facturation_statuses = self._normalize_facturation_statuses(state.facturation_statuses)

        # keep facture_statuses in sync with facturation_statuses
        if state.facturation_statuses and state.facture_statuses != state.facturation_statuses:
            state.facture_statuses = state.facturation_statuses

        # migrate factures created with removed intermediate status.
        for facture in state.factures:
            if facture.statut == "En attente de vérification métier":
                facture.statut = "Vérification métier"
            if facture.statut == "Terminé":
                facture.statut = "Clôturée"
            if facture.statut == "Validation N+1":
                facture.statut = "Validation métier N+1"
            if facture.statut in {
                "Demande d'informations complémentaire",
                "Demande d'information complémentaire",
            }:
                facture.statut = "Demande d'information complémentaire (Validation métier N+1)"
            if facture.statut == "Validation LAD 2":
                facture.statut = "Signature LAD 2"
            if facture.statut == "Validation LAD 3":
                facture.statut = "Signature LAD 3"

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
            facture_statuses=state.facture_statuses,
            user_roles=state.user_roles,
            role_labels=state.role_labels,
            directions=state.directions,
            workflow_steps=state.facture_statuses,
            workflow_assignments=state.workflow_assignments,
            appro_statuses=state.appro_statuses,
            facturation_statuses=state.facturation_statuses,
        )

    def list_workflow_tasks(self) -> list[WorkflowTask]:
        state = self._state_with_seed()
        user_lookup = {
            user.id: (user.full_name or user.username)
            for user in state.users
        }
        assignment_lookup = {
            f"{assignment.workflow_type}:{assignment.step}": assignment
            for assignment in state.workflow_assignments
        }

        tasks: list[WorkflowTask] = []

        for facture in state.factures:
            history = list(facture.history or [])
            latest = history[0] if history else None
            assignment = assignment_lookup.get(f"facturation:{facture.statut}")
            assigned_users = [
                user_lookup[user_id]
                for user_id in (assignment.user_ids if assignment else [])
                if user_id in user_lookup
            ]
            pieces_jointes = self._collect_attachments(history, facture.piecesJointes)

            tasks.append(
                WorkflowTask(
                    id=f"facturation:{facture.id}",
                    workflow_type="facturation",
                    reference=facture.id,
                    step=facture.statut,
                    resolved_by=latest.actor if latest else "",
                    resolved_at=latest.at if latest else "",
                    assigned_users=assigned_users,
                    pieces_jointes=pieces_jointes,
                    history=history,
                )
            )

        for ticket in state.appro.tickets:
            history = list(ticket.history or [])
            latest = history[0] if history else None
            assignment = assignment_lookup.get(f"appro:{ticket.statut}")
            assigned_users = [
                user_lookup[user_id]
                for user_id in (assignment.user_ids if assignment else [])
                if user_id in user_lookup
            ]
            pieces_jointes = self._collect_attachments(history, [ticket.fichier_nom])

            tasks.append(
                WorkflowTask(
                    id=f"approvisionnement:{ticket.id}",
                    workflow_type="approvisionnement",
                    reference=ticket.id,
                    step=ticket.statut,
                    resolved_by=latest.actor if latest else "",
                    resolved_at=latest.at if latest else "",
                    assigned_users=assigned_users,
                    pieces_jointes=pieces_jointes,
                    history=history,
                )
            )

        tasks.sort(key=lambda task: task.resolved_at or "", reverse=True)
        return tasks

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

    def list_factures(self) -> list[Facture]:
        return self._state_with_seed().factures

    def delete_facture(self, facture_id: str) -> list[Facture]:
        state = self._state_with_seed()
        facture = next((item for item in state.factures if item.id == facture_id), None)
        if facture is None:
            raise HTTPException(status_code=404, detail="Facture introuvable.")

        state.factures = [item for item in state.factures if item.id != facture_id]
        for ticket in state.appro.tickets:
            if ticket.linkedFactureId == facture_id:
                ticket.linkedFactureId = ""
                if ticket.statut == "Transférée en facturation":
                    ticket.statut = "Initialisation"
        self.store.write(state)
        return state.factures

    def get_facture(self, facture_id: str) -> Facture:
        state = self._state_with_seed()
        facture = next((item for item in state.factures if item.id == facture_id), None)
        if facture is None:
            raise HTTPException(status_code=404, detail="Facture introuvable.")
        return facture

    def create_facture(self, payload: FactureCreate) -> Facture:
        state = self._state_with_seed()
        reception_date = payload.dateReception or payload.echeance
        charge_account = payload.compteCharge or payload.centreCout
        facture = Facture(
            id=self._create_facture_reference(state.factures),
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
            statut="Vérification métier",
            history=[
                HistoryEntry(
                    at=self._now_iso(),
                    actor=payload.actor,
                    email=getattr(payload, 'email', None),
                    role=payload.role,
                    action="Demande soumise et étape de saisie validée automatiquement",
                )
            ],
        )
        state.factures = [facture, *state.factures]
        self.store.write(state)
        return facture

    def update_facture_status(self, facture_id: str, payload: FactureStatusUpdate) -> Facture:
        state = self._state_with_seed()
        facture = next((item for item in state.factures if item.id == facture_id), None)
        if facture is None:
            raise HTTPException(status_code=404, detail="Facture introuvable.")

        comment_value = (payload.commentaire or "").strip()
        attachments_value = [name for name in payload.piecesJointes if name]
        detail_parts: list[str] = []
        if comment_value:
            detail_parts.append(f"Commentaire: {comment_value}")
        if attachments_value:
            detail_parts.append(f"Pièces jointes: {', '.join(attachments_value)}")

        next_status = payload.next_status
        if next_status == "Paiement effectué":
            facture.statut = "Clôturée"
            action_label = payload.action_label or "Paiement effectué - clôture automatique"
        else:
            facture.statut = next_status
            action_label = payload.action_label or f"Statut passe a {next_status}"

        facture.history = [
            HistoryEntry(
                at=self._now_iso(),
                actor=payload.actor,
                email=getattr(payload, 'email', None),
                role=payload.role,
                action=action_label,
                detail=" | ".join(detail_parts) if detail_parts else None,
                commentaire=comment_value,
                piecesJointes=attachments_value,
            ),
            *facture.history,
        ]
        self.store.write(state)
        return facture

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
            linkedFactureId="",
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

    def delete_supply_ticket(self, ticket_id: str) -> ApproState:
        state = self._state_with_seed()
        ticket = self._find_ticket(state, ticket_id)

        if ticket.linkedFactureId:
            state.factures = [item for item in state.factures if item.id != ticket.linkedFactureId]

        state.appro.tickets = [item for item in state.appro.tickets if item.id != ticket_id]
        self.store.write(state)
        return state.appro

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

    def close_ticket(self, ticket_id: str, actor: str = "Agent Approvisionnement") -> ApproState:
        state = self._state_with_seed()
        ticket = self._find_ticket(state, ticket_id)
        if ticket.statut == "Clôturée" or ticket.linkedFactureId:
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

        user.last_login_at = self._now_iso()
        user.updated_at = user.last_login_at
        self.store.write(state)

        token = create_token(subject=user.id, username=user.username, role=user.role)
        return TokenResponse(
            access_token=token,
            user=self._to_auth_user_summary(user),
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

        return self._to_auth_user_summary(user)

    def list_users(self) -> list[AuthUserSummary]:
        state = self._state_with_seed()
        return [self._to_auth_user_summary(user) for user in state.users]

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

        all_valid_steps = state.appro_statuses + state.facturation_statuses + state.facture_statuses
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
        first_name: str | None = None,
        last_name: str | None = None,
        employee_id: str | None = None,
        department: str | None = None,
        job_title: str | None = None,
        phone_number: str | None = None,
        manager_id: str | None = None,
        locale: str = "fr-FR",
        timezone: str = "Africa/Dakar",
    ) -> AuthUserSummary:
        state = self._state_with_seed()
        normalized_username = username.strip().lower()
        existing = next((item for item in state.users if item.username.lower() == normalized_username), None)
        if existing is not None:
            raise HTTPException(status_code=409, detail="Cet identifiant existe déjà.")

        normalized_email = (email or "").strip().lower()
        if not normalized_email:
            raise HTTPException(status_code=400, detail="L'email est obligatoire.")
        if any((existing_user.email or "").lower() == normalized_email for existing_user in state.users):
            raise HTTPException(status_code=409, detail="Cet email existe déjà.")

        normalized_roles = list(dict.fromkeys([*(roles or []), role]))
        invalid_roles = [item for item in normalized_roles if item not in state.user_roles]
        if invalid_roles:
            raise HTTPException(status_code=400, detail="Un ou plusieurs rôles ne sont pas connus du backend.")

        now_iso = self._now_iso()
        derived_first_name, derived_last_name = self._derive_names(
            full_name=full_name,
            first_name=first_name,
            last_name=last_name,
        )

        if manager_id and not any(existing_user.id == manager_id for existing_user in state.users):
            raise HTTPException(status_code=400, detail="Le manager sélectionné est introuvable.")

        user = User(
            id=self._create_user_id(state.users),
            username=normalized_username,
            full_name=full_name.strip(),
            first_name=derived_first_name,
            last_name=derived_last_name,
            email=normalized_email,
            employee_id=(employee_id or "").strip() or None,
            department=(department or "").strip() or None,
            job_title=(job_title or "").strip() or None,
            phone_number=(phone_number or "").strip() or None,
            manager_id=manager_id,
            locale=(locale or "fr-FR").strip() or "fr-FR",
            timezone=(timezone or "Africa/Dakar").strip() or "Africa/Dakar",
            role=normalized_roles[0],
            roles=normalized_roles,
            password_hash=hash_password(password),
            is_active=True,
            status="active",
            created_at=now_iso,
            updated_at=now_iso,
            last_login_at=None,
        )
        state.users = [user, *state.users]
        self.store.write(state)
        return self._to_auth_user_summary(user)

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

        normalized_email = (payload.email or "").strip().lower()
        if not normalized_email:
            raise HTTPException(status_code=400, detail="L'email est obligatoire.")
        if any(
            existing_user.id != user.id and (existing_user.email or "").lower() == normalized_email
            for existing_user in state.users
        ):
            raise HTTPException(status_code=409, detail="Cet email existe déjà.")

        if payload.manager_id and payload.manager_id == user.id:
            raise HTTPException(status_code=400, detail="Un utilisateur ne peut pas être son propre manager.")
        if payload.manager_id and not any(existing_user.id == payload.manager_id for existing_user in state.users):
            raise HTTPException(status_code=400, detail="Le manager sélectionné est introuvable.")

        derived_first_name, derived_last_name = self._derive_names(
            full_name=payload.full_name,
            first_name=payload.first_name,
            last_name=payload.last_name,
        )

        user.full_name = payload.full_name.strip()
        user.first_name = derived_first_name
        user.last_name = derived_last_name
        user.email = normalized_email
        user.employee_id = (payload.employee_id or "").strip() or None
        user.department = (payload.department or "").strip() or None
        user.job_title = (payload.job_title or "").strip() or None
        user.phone_number = (payload.phone_number or "").strip() or None
        user.manager_id = payload.manager_id
        user.locale = (payload.locale or "fr-FR").strip() or "fr-FR"
        user.timezone = (payload.timezone or "Africa/Dakar").strip() or "Africa/Dakar"
        user.role = payload.role
        user.roles = payload.roles
        user.is_active = payload.is_active
        user.status = payload.status or ("active" if payload.is_active else "inactive")
        user.updated_at = self._now_iso()

        self.store.write(state)
        return self._to_auth_user_summary(user)

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

    def _create_facture_reference(self, factures: list[Facture]) -> str:
        year = datetime.now(timezone.utc).year
        prefix = f"FAC-{year}-"
        max_sequence = 0
        for facture in factures:
            if not facture.id.startswith(prefix):
                continue
            suffix = facture.id.replace(prefix, "", 1)
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

    def _to_auth_user_summary(self, user: User) -> AuthUserSummary:
        return AuthUserSummary(
            id=user.id,
            username=user.username,
            full_name=user.full_name,
            first_name=user.first_name,
            last_name=user.last_name,
            email=user.email,
            employee_id=user.employee_id,
            department=user.department,
            job_title=user.job_title,
            phone_number=user.phone_number,
            locale=user.locale,
            timezone=user.timezone,
            role=user.role,
            roles=user.roles,
            is_active=user.is_active,
            status=user.status,
            created_at=user.created_at,
            updated_at=user.updated_at,
            last_login_at=user.last_login_at,
        )

    def _derive_names(self, full_name: str, first_name: str | None = None, last_name: str | None = None) -> tuple[str | None, str | None]:
        normalized_full_name = (full_name or "").strip()
        normalized_first_name = (first_name or "").strip() or None
        normalized_last_name = (last_name or "").strip() or None

        if normalized_first_name and normalized_last_name:
            return normalized_first_name, normalized_last_name

        if normalized_full_name:
            parts = normalized_full_name.split()
            if not normalized_first_name and parts:
                normalized_first_name = parts[0]
            if not normalized_last_name and len(parts) > 1:
                normalized_last_name = " ".join(parts[1:])

        return normalized_first_name, normalized_last_name

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

    def _collect_attachments(self, history: list[HistoryEntry], extra_files: list[str] | None = None) -> list[str]:
        files: list[str] = []
        seen: set[str] = set()

        for name in (extra_files or []):
            normalized = (name or "").strip()
            if not normalized or normalized in seen:
                continue
            seen.add(normalized)
            files.append(normalized)

        for entry in history:
            for name in entry.piecesJointes:
                normalized = (name or "").strip()
                if not normalized or normalized in seen:
                    continue
                seen.add(normalized)
                files.append(normalized)

        return files

    def _now_iso(self) -> str:
        return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")

    def _today(self) -> str:
        return datetime.now(timezone.utc).date().isoformat()