import json
import sqlite3
from copy import deepcopy
from pathlib import Path
from threading import RLock

from .config import DB_PATH, LEGACY_DB_PATH
from .schemas import AppState
from .seed_data import SEED_DATA


class JsonStore:
    """Relational SQLite store keeping the same read/write AppState contract.

    The service layer still manipulates AppState objects, but persistence now uses
    normalized tables instead of a single JSON payload row.
    """

    def __init__(self, path=DB_PATH):
        self.path = Path(path)
        self.legacy_path = LEGACY_DB_PATH if self.path == DB_PATH else self.path.with_name(f"{self.path.stem}.json")
        self._lock = RLock()

    def ensure_seed_parent(self) -> None:
        self.path.parent.mkdir(parents=True, exist_ok=True)

    def ensure_seed(self) -> None:
        self.ensure_seed_parent()
        with sqlite3.connect(self.path) as connection:
            connection.row_factory = sqlite3.Row
            self._ensure_schema(connection)

            if self._is_initialized(connection):
                return

            state = self._load_state_from_legacy_sources(connection)
            if state is None:
                state = AppState.model_validate(deepcopy(SEED_DATA))

            self._write_state_to_db(connection, state)
            self._set_initialized(connection)
            connection.commit()

    def read(self) -> AppState:
        with self._lock:
            self.ensure_seed()
            with sqlite3.connect(self.path) as connection:
                connection.row_factory = sqlite3.Row
                self._ensure_schema(connection)
                state = self._read_state_from_db(connection)
                if state is not None:
                    return state

            fallback_state = AppState.model_validate(deepcopy(SEED_DATA))
            self.write(fallback_state)
            return fallback_state

    def write(self, state: AppState) -> AppState:
        with self._lock:
            self.ensure_seed_parent()
            with sqlite3.connect(self.path) as connection:
                connection.row_factory = sqlite3.Row
                self._ensure_schema(connection)
                self._write_state_to_db(connection, state)
                self._set_initialized(connection)
                connection.commit()
            return state

    def _load_state_from_legacy_sources(self, connection: sqlite3.Connection) -> AppState | None:
        # 1) legacy blob table in the same sqlite file
        try:
            row = connection.execute(
                "SELECT payload FROM app_state WHERE id = ?",
                ("state",),
            ).fetchone()
            if row and row["payload"]:
                return AppState.model_validate(json.loads(row["payload"]))
        except sqlite3.DatabaseError:
            pass

        # 2) legacy JSON file
        if self.legacy_path != self.path and self.legacy_path.exists():
            try:
                legacy_payload = json.loads(self.legacy_path.read_text(encoding="utf-8"))
                return AppState.model_validate(legacy_payload)
            except (json.JSONDecodeError, OSError):
                pass

        return None

    def _is_initialized(self, connection: sqlite3.Connection) -> bool:
        row = connection.execute(
            "SELECT value FROM system_meta WHERE key = ?",
            ("initialized",),
        ).fetchone()
        return bool(row and row["value"] == "1")

    def _set_initialized(self, connection: sqlite3.Connection) -> None:
        connection.execute(
            """
            INSERT INTO system_meta (key, value)
            VALUES (?, ?)
            ON CONFLICT(key) DO UPDATE SET value = excluded.value
            """,
            ("initialized", "1"),
        )

    def _ensure_schema(self, connection: sqlite3.Connection) -> None:
        connection.executescript(
            """
            PRAGMA foreign_keys = ON;

            CREATE TABLE IF NOT EXISTS system_meta (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS roles (
                code TEXT PRIMARY KEY,
                label TEXT NOT NULL,
                position INTEGER NOT NULL
            );

            CREATE TABLE IF NOT EXISTS directions (
                name TEXT PRIMARY KEY,
                position INTEGER NOT NULL
            );

            CREATE TABLE IF NOT EXISTS status_catalog (
                workflow TEXT NOT NULL,
                status TEXT NOT NULL,
                position INTEGER NOT NULL,
                PRIMARY KEY (workflow, status)
            );

            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                username TEXT NOT NULL UNIQUE,
                full_name TEXT NOT NULL,
                first_name TEXT,
                last_name TEXT,
                email TEXT NOT NULL UNIQUE,
                employee_id TEXT,
                department TEXT,
                job_title TEXT,
                phone_number TEXT,
                manager_id TEXT,
                locale TEXT NOT NULL,
                timezone TEXT NOT NULL,
                role TEXT NOT NULL,
                password_hash TEXT NOT NULL,
                is_active INTEGER NOT NULL,
                status TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                last_login_at TEXT,
                position INTEGER NOT NULL DEFAULT 0
            );

            CREATE TABLE IF NOT EXISTS user_roles (
                user_id TEXT NOT NULL,
                role TEXT NOT NULL,
                position INTEGER NOT NULL,
                PRIMARY KEY (user_id, role),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS workflow_assignments (
                workflow_type TEXT NOT NULL,
                step TEXT NOT NULL,
                user_id TEXT NOT NULL,
                position INTEGER NOT NULL,
                PRIMARY KEY (workflow_type, step, user_id)
            );

            CREATE TABLE IF NOT EXISTS factures (
                id TEXT PRIMARY KEY,
                fournisseur TEXT NOT NULL,
                montant REAL NOT NULL,
                devise TEXT NOT NULL,
                centre_cout TEXT NOT NULL,
                description TEXT NOT NULL,
                echeance TEXT NOT NULL,
                priorite TEXT NOT NULL,
                direction TEXT NOT NULL,
                resume TEXT NOT NULL,
                numero_facture TEXT NOT NULL,
                compte_charge TEXT NOT NULL,
                date_reception TEXT NOT NULL,
                mode_reception TEXT NOT NULL,
                statut TEXT NOT NULL,
                position INTEGER NOT NULL
            );

            CREATE TABLE IF NOT EXISTS facture_attachments (
                facture_id TEXT NOT NULL,
                filename TEXT NOT NULL,
                position INTEGER NOT NULL,
                PRIMARY KEY (facture_id, position),
                FOREIGN KEY (facture_id) REFERENCES factures(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS facture_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                facture_id TEXT NOT NULL,
                event_at TEXT NOT NULL,
                actor TEXT NOT NULL,
                email TEXT,
                action TEXT NOT NULL,
                role TEXT,
                detail TEXT,
                commentaire TEXT NOT NULL,
                position INTEGER NOT NULL,
                FOREIGN KEY (facture_id) REFERENCES factures(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS facture_history_attachments (
                history_id INTEGER NOT NULL,
                filename TEXT NOT NULL,
                position INTEGER NOT NULL,
                PRIMARY KEY (history_id, position),
                FOREIGN KEY (history_id) REFERENCES facture_history(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS appro_budgets (
                direction TEXT PRIMARY KEY,
                allocated REAL NOT NULL,
                engaged REAL NOT NULL,
                allocated_by TEXT NOT NULL,
                position INTEGER NOT NULL
            );

            CREATE TABLE IF NOT EXISTS appro_tickets (
                id TEXT PRIMARY KEY,
                direction TEXT NOT NULL,
                objet TEXT NOT NULL,
                montant REAL NOT NULL,
                devise TEXT NOT NULL,
                titre_demande TEXT NOT NULL,
                domaine TEXT NOT NULL,
                sous_domaine TEXT NOT NULL,
                action_demande TEXT NOT NULL,
                date_debut_souhaitee TEXT NOT NULL,
                date_fin_souhaitee TEXT NOT NULL,
                direction_demandeur TEXT NOT NULL,
                budget_previsionnel REAL NOT NULL,
                priorite TEXT NOT NULL,
                description TEXT NOT NULL,
                commentaire TEXT NOT NULL,
                fichier_nom TEXT NOT NULL,
                statut TEXT NOT NULL,
                linked_facture_id TEXT NOT NULL,
                position INTEGER NOT NULL
            );

            CREATE TABLE IF NOT EXISTS appro_ticket_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ticket_id TEXT NOT NULL,
                event_id TEXT,
                event_at TEXT NOT NULL,
                actor TEXT NOT NULL,
                email TEXT,
                action TEXT NOT NULL,
                role TEXT,
                detail TEXT,
                commentaire TEXT NOT NULL,
                position INTEGER NOT NULL,
                FOREIGN KEY (ticket_id) REFERENCES appro_tickets(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS appro_ticket_history_attachments (
                history_id INTEGER NOT NULL,
                filename TEXT NOT NULL,
                position INTEGER NOT NULL,
                PRIMARY KEY (history_id, position),
                FOREIGN KEY (history_id) REFERENCES appro_ticket_history(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS dirfin_history (
                id TEXT PRIMARY KEY,
                event_at TEXT NOT NULL,
                actor TEXT NOT NULL,
                action TEXT NOT NULL,
                detail TEXT NOT NULL,
                position INTEGER NOT NULL
            );

            CREATE TABLE IF NOT EXISTS kpi_metrics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                label TEXT NOT NULL,
                value TEXT NOT NULL,
                trend TEXT NOT NULL,
                tone TEXT NOT NULL,
                position INTEGER NOT NULL
            );

            CREATE TABLE IF NOT EXISTS missions (
                code TEXT PRIMARY KEY,
                collaborateur TEXT NOT NULL,
                destination TEXT NOT NULL,
                frais TEXT NOT NULL,
                statut TEXT NOT NULL,
                position INTEGER NOT NULL
            );

            CREATE TABLE IF NOT EXISTS trace_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                event_date TEXT NOT NULL,
                action TEXT NOT NULL,
                actor TEXT NOT NULL,
                position INTEGER NOT NULL
            );

            CREATE TABLE IF NOT EXISTS budget_lines (
                poste TEXT PRIMARY KEY,
                consomme INTEGER NOT NULL,
                plafond TEXT NOT NULL,
                tendance TEXT NOT NULL,
                position INTEGER NOT NULL
            );
            """
        )

    def _clear_relational_data(self, connection: sqlite3.Connection) -> None:
        for table in [
            "roles",
            "directions",
            "status_catalog",
            "users",
            "user_roles",
            "workflow_assignments",
            "factures",
            "facture_attachments",
            "facture_history",
            "facture_history_attachments",
            "appro_budgets",
            "appro_tickets",
            "appro_ticket_history",
            "appro_ticket_history_attachments",
            "dirfin_history",
            "kpi_metrics",
            "missions",
            "trace_events",
            "budget_lines",
        ]:
            connection.execute(f"DELETE FROM {table}")

    def _write_state_to_db(self, connection: sqlite3.Connection, state: AppState) -> None:
        self._clear_relational_data(connection)

        for pos, code in enumerate(state.user_roles):
            connection.execute(
                "INSERT INTO roles (code, label, position) VALUES (?, ?, ?)",
                (code, state.role_labels.get(code, code), pos),
            )

        for pos, direction in enumerate(state.directions):
            connection.execute(
                "INSERT INTO directions (name, position) VALUES (?, ?)",
                (direction, pos),
            )

        for workflow_name, statuses in [
            ("facture", state.facture_statuses),
            ("facturation", state.facturation_statuses),
            ("appro", state.appro_statuses),
        ]:
            for pos, status in enumerate(statuses):
                connection.execute(
                    "INSERT INTO status_catalog (workflow, status, position) VALUES (?, ?, ?)",
                    (workflow_name, status, pos),
                )

        for user_pos, user in enumerate(state.users):
            connection.execute(
                """
                INSERT INTO users (
                    id, username, full_name, first_name, last_name, email, employee_id,
                    department, job_title, phone_number, manager_id, locale, timezone,
                    role, password_hash, is_active, status, created_at, updated_at, last_login_at, position
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    user.id,
                    user.username,
                    user.full_name,
                    user.first_name,
                    user.last_name,
                    user.email,
                    user.employee_id,
                    user.department,
                    user.job_title,
                    user.phone_number,
                    user.manager_id,
                    user.locale,
                    user.timezone,
                    user.role,
                    user.password_hash,
                    1 if user.is_active else 0,
                    user.status,
                    user.created_at,
                    user.updated_at,
                    user.last_login_at,
                    user_pos,
                ),
            )

            for pos, role in enumerate(user.roles):
                connection.execute(
                    "INSERT INTO user_roles (user_id, role, position) VALUES (?, ?, ?)",
                    (user.id, role, pos),
                )

        for assignment in state.workflow_assignments:
            for pos, user_id in enumerate(assignment.user_ids):
                connection.execute(
                    """
                    INSERT INTO workflow_assignments (workflow_type, step, user_id, position)
                    VALUES (?, ?, ?, ?)
                    """,
                    (assignment.workflow_type, assignment.step, user_id, pos),
                )

        for pos, facture in enumerate(state.factures):
            connection.execute(
                """
                INSERT INTO factures (
                    id, fournisseur, montant, devise, centre_cout, description, echeance,
                    priorite, direction, resume, numero_facture, compte_charge,
                    date_reception, mode_reception, statut, position
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    facture.id,
                    facture.fournisseur,
                    facture.montant,
                    facture.devise,
                    facture.centreCout,
                    facture.description,
                    facture.echeance,
                    facture.priorite,
                    facture.direction,
                    facture.resume,
                    facture.numeroFacture,
                    facture.compteCharge,
                    facture.dateReception,
                    facture.modeReception,
                    facture.statut,
                    pos,
                ),
            )

            for attachment_pos, filename in enumerate(facture.piecesJointes):
                connection.execute(
                    "INSERT INTO facture_attachments (facture_id, filename, position) VALUES (?, ?, ?)",
                    (facture.id, filename, attachment_pos),
                )

            for hist_pos, event in enumerate(facture.history):
                cursor = connection.execute(
                    """
                    INSERT INTO facture_history (
                        facture_id, event_at, actor, email, action, role, detail, commentaire, position
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        facture.id,
                        event.at,
                        event.actor,
                        event.email,
                        event.action,
                        event.role,
                        event.detail,
                        event.commentaire,
                        hist_pos,
                    ),
                )
                history_id = cursor.lastrowid
                for p_pos, filename in enumerate(event.piecesJointes):
                    connection.execute(
                        "INSERT INTO facture_history_attachments (history_id, filename, position) VALUES (?, ?, ?)",
                        (history_id, filename, p_pos),
                    )

        for pos, budget in enumerate(state.appro.budgets):
            connection.execute(
                "INSERT INTO appro_budgets (direction, allocated, engaged, allocated_by, position) VALUES (?, ?, ?, ?, ?)",
                (budget.direction, budget.allocated, budget.engaged, budget.allocatedBy, pos),
            )

        for pos, ticket in enumerate(state.appro.tickets):
            connection.execute(
                """
                INSERT INTO appro_tickets (
                    id, direction, objet, montant, devise, titre_demande, domaine, sous_domaine,
                    action_demande, date_debut_souhaitee, date_fin_souhaitee, direction_demandeur,
                    budget_previsionnel, priorite, description, commentaire, fichier_nom,
                    statut, linked_facture_id, position
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    ticket.id,
                    ticket.direction,
                    ticket.objet,
                    ticket.montant,
                    ticket.devise,
                    ticket.titre_demande,
                    ticket.domaine,
                    ticket.sous_domaine,
                    ticket.action_demande,
                    ticket.date_debut_souhaitee,
                    ticket.date_fin_souhaitee,
                    ticket.direction_demandeur,
                    ticket.budget_previsionnel,
                    ticket.priorite,
                    ticket.description,
                    ticket.commentaire,
                    ticket.fichier_nom,
                    ticket.statut,
                    ticket.linkedFactureId,
                    pos,
                ),
            )

            for hist_pos, event in enumerate(ticket.history):
                event_dict = event.model_dump() if hasattr(event, "model_dump") else dict(event)
                cursor = connection.execute(
                    """
                    INSERT INTO appro_ticket_history (
                        ticket_id, event_id, event_at, actor, email, action, role, detail, commentaire, position
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        ticket.id,
                        event_dict.get("id"),
                        event_dict.get("at", ""),
                        event_dict.get("actor", ""),
                        event_dict.get("email"),
                        event_dict.get("action", ""),
                        event_dict.get("role"),
                        event_dict.get("detail"),
                        event_dict.get("commentaire", ""),
                        hist_pos,
                    ),
                )
                history_id = cursor.lastrowid
                for p_pos, filename in enumerate(event_dict.get("piecesJointes", []) or []):
                    connection.execute(
                        "INSERT INTO appro_ticket_history_attachments (history_id, filename, position) VALUES (?, ?, ?)",
                        (history_id, filename, p_pos),
                    )

        for pos, event in enumerate(state.appro.dirfinHistory):
            connection.execute(
                "INSERT INTO dirfin_history (id, event_at, actor, action, detail, position) VALUES (?, ?, ?, ?, ?, ?)",
                (event.id, event.at, event.actor, event.action, event.detail, pos),
            )

        for pos, metric in enumerate(state.kpi_metrics):
            connection.execute(
                "INSERT INTO kpi_metrics (label, value, trend, tone, position) VALUES (?, ?, ?, ?, ?)",
                (metric.label, metric.value, metric.trend, metric.tone, pos),
            )

        for pos, mission in enumerate(state.missions):
            connection.execute(
                "INSERT INTO missions (code, collaborateur, destination, frais, statut, position) VALUES (?, ?, ?, ?, ?, ?)",
                (mission.code, mission.collaborateur, mission.destination, mission.frais, mission.statut, pos),
            )

        for pos, event in enumerate(state.trace_events):
            connection.execute(
                "INSERT INTO trace_events (event_date, action, actor, position) VALUES (?, ?, ?, ?)",
                (event.date, event.action, event.actor, pos),
            )

        for pos, line in enumerate(state.budget_lines):
            connection.execute(
                "INSERT INTO budget_lines (poste, consomme, plafond, tendance, position) VALUES (?, ?, ?, ?, ?)",
                (line.poste, line.consomme, line.plafond, line.tendance, pos),
            )

    def _read_state_from_db(self, connection: sqlite3.Connection) -> AppState | None:
        roles_rows = connection.execute(
            "SELECT code, label FROM roles ORDER BY position ASC"
        ).fetchall()
        if not roles_rows:
            return None

        role_labels = {row["code"]: row["label"] for row in roles_rows}
        user_roles = [row["code"] for row in roles_rows]

        directions = [
            row["name"]
            for row in connection.execute("SELECT name FROM directions ORDER BY position ASC").fetchall()
        ]

        status_catalog = {}
        for row in connection.execute(
            "SELECT workflow, status FROM status_catalog ORDER BY workflow ASC, position ASC"
        ).fetchall():
            status_catalog.setdefault(row["workflow"], []).append(row["status"])

        users = []
        user_rows = connection.execute(
            "SELECT * FROM users ORDER BY position ASC"
        ).fetchall()
        for row in user_rows:
            roles = [
                r["role"]
                for r in connection.execute(
                    "SELECT role FROM user_roles WHERE user_id = ? ORDER BY position ASC",
                    (row["id"],),
                ).fetchall()
            ]
            users.append(
                {
                    "id": row["id"],
                    "username": row["username"],
                    "full_name": row["full_name"],
                    "first_name": row["first_name"],
                    "last_name": row["last_name"],
                    "email": row["email"],
                    "employee_id": row["employee_id"],
                    "department": row["department"],
                    "job_title": row["job_title"],
                    "phone_number": row["phone_number"],
                    "manager_id": row["manager_id"],
                    "locale": row["locale"],
                    "timezone": row["timezone"],
                    "role": row["role"],
                    "roles": roles,
                    "password_hash": row["password_hash"],
                    "is_active": bool(row["is_active"]),
                    "status": row["status"],
                    "created_at": row["created_at"],
                    "updated_at": row["updated_at"],
                    "last_login_at": row["last_login_at"],
                }
            )

        workflow_assignment_rows = connection.execute(
            "SELECT workflow_type, step, user_id, position FROM workflow_assignments ORDER BY workflow_type, step, position"
        ).fetchall()
        assignment_map = {}
        for row in workflow_assignment_rows:
            key = (row["workflow_type"], row["step"])
            assignment_map.setdefault(key, []).append(row["user_id"])
        workflow_assignments = [
            {"workflow_type": wf, "step": step, "user_ids": user_ids}
            for (wf, step), user_ids in assignment_map.items()
        ]

        factures = []
        facture_rows = connection.execute(
            "SELECT * FROM factures ORDER BY position ASC"
        ).fetchall()
        for facture_row in facture_rows:
            pieces_jointes = [
                row["filename"]
                for row in connection.execute(
                    "SELECT filename FROM facture_attachments WHERE facture_id = ? ORDER BY position ASC",
                    (facture_row["id"],),
                ).fetchall()
            ]

            history_rows = connection.execute(
                "SELECT * FROM facture_history WHERE facture_id = ? ORDER BY position ASC",
                (facture_row["id"],),
            ).fetchall()
            history = []
            for hist_row in history_rows:
                history_attachments = [
                    row["filename"]
                    for row in connection.execute(
                        "SELECT filename FROM facture_history_attachments WHERE history_id = ? ORDER BY position ASC",
                        (hist_row["id"],),
                    ).fetchall()
                ]
                history.append(
                    {
                        "id": None,
                        "at": hist_row["event_at"],
                        "actor": hist_row["actor"],
                        "email": hist_row["email"],
                        "action": hist_row["action"],
                        "role": hist_row["role"],
                        "detail": hist_row["detail"],
                        "commentaire": hist_row["commentaire"] or "",
                        "piecesJointes": history_attachments,
                    }
                )

            factures.append(
                {
                    "id": facture_row["id"],
                    "fournisseur": facture_row["fournisseur"],
                    "montant": facture_row["montant"],
                    "devise": facture_row["devise"],
                    "centreCout": facture_row["centre_cout"],
                    "description": facture_row["description"],
                    "echeance": facture_row["echeance"],
                    "priorite": facture_row["priorite"],
                    "direction": facture_row["direction"],
                    "resume": facture_row["resume"],
                    "numeroFacture": facture_row["numero_facture"],
                    "compteCharge": facture_row["compte_charge"],
                    "dateReception": facture_row["date_reception"],
                    "modeReception": facture_row["mode_reception"],
                    "piecesJointes": pieces_jointes,
                    "statut": facture_row["statut"],
                    "history": history,
                }
            )

        appro_budgets = [
            {
                "direction": row["direction"],
                "allocated": row["allocated"],
                "engaged": row["engaged"],
                "allocatedBy": row["allocated_by"],
            }
            for row in connection.execute(
                "SELECT * FROM appro_budgets ORDER BY position ASC"
            ).fetchall()
        ]

        appro_tickets = []
        ticket_rows = connection.execute(
            "SELECT * FROM appro_tickets ORDER BY position ASC"
        ).fetchall()
        for ticket_row in ticket_rows:
            history_rows = connection.execute(
                "SELECT * FROM appro_ticket_history WHERE ticket_id = ? ORDER BY position ASC",
                (ticket_row["id"],),
            ).fetchall()

            ticket_history = []
            for hist_row in history_rows:
                history_attachments = [
                    row["filename"]
                    for row in connection.execute(
                        "SELECT filename FROM appro_ticket_history_attachments WHERE history_id = ? ORDER BY position ASC",
                        (hist_row["id"],),
                    ).fetchall()
                ]
                ticket_history.append(
                    {
                        "id": hist_row["event_id"],
                        "at": hist_row["event_at"],
                        "actor": hist_row["actor"],
                        "email": hist_row["email"],
                        "action": hist_row["action"],
                        "role": hist_row["role"],
                        "detail": hist_row["detail"],
                        "commentaire": hist_row["commentaire"] or "",
                        "piecesJointes": history_attachments,
                    }
                )

            appro_tickets.append(
                {
                    "id": ticket_row["id"],
                    "direction": ticket_row["direction"],
                    "objet": ticket_row["objet"],
                    "montant": ticket_row["montant"],
                    "devise": ticket_row["devise"],
                    "titre_demande": ticket_row["titre_demande"],
                    "domaine": ticket_row["domaine"],
                    "sous_domaine": ticket_row["sous_domaine"],
                    "action_demande": ticket_row["action_demande"],
                    "date_debut_souhaitee": ticket_row["date_debut_souhaitee"],
                    "date_fin_souhaitee": ticket_row["date_fin_souhaitee"],
                    "direction_demandeur": ticket_row["direction_demandeur"],
                    "budget_previsionnel": ticket_row["budget_previsionnel"],
                    "priorite": ticket_row["priorite"],
                    "description": ticket_row["description"],
                    "commentaire": ticket_row["commentaire"],
                    "fichier_nom": ticket_row["fichier_nom"],
                    "statut": ticket_row["statut"],
                    "linkedFactureId": ticket_row["linked_facture_id"],
                    "history": ticket_history,
                }
            )

        dirfin_history = [
            {
                "id": row["id"],
                "at": row["event_at"],
                "actor": row["actor"],
                "action": row["action"],
                "detail": row["detail"],
            }
            for row in connection.execute(
                "SELECT * FROM dirfin_history ORDER BY position ASC"
            ).fetchall()
        ]

        kpi_metrics = [
            {
                "label": row["label"],
                "value": row["value"],
                "trend": row["trend"],
                "tone": row["tone"],
            }
            for row in connection.execute(
                "SELECT label, value, trend, tone FROM kpi_metrics ORDER BY position ASC"
            ).fetchall()
        ]

        missions = [
            {
                "code": row["code"],
                "collaborateur": row["collaborateur"],
                "destination": row["destination"],
                "frais": row["frais"],
                "statut": row["statut"],
            }
            for row in connection.execute(
                "SELECT code, collaborateur, destination, frais, statut FROM missions ORDER BY position ASC"
            ).fetchall()
        ]

        trace_events = [
            {
                "date": row["event_date"],
                "action": row["action"],
                "actor": row["actor"],
            }
            for row in connection.execute(
                "SELECT event_date, action, actor FROM trace_events ORDER BY position ASC"
            ).fetchall()
        ]

        budget_lines = [
            {
                "poste": row["poste"],
                "consomme": row["consomme"],
                "plafond": row["plafond"],
                "tendance": row["tendance"],
            }
            for row in connection.execute(
                "SELECT poste, consomme, plafond, tendance FROM budget_lines ORDER BY position ASC"
            ).fetchall()
        ]

        state_payload = {
            "factures": factures,
            "appro": {
                "budgets": appro_budgets,
                "tickets": appro_tickets,
                "dirfinHistory": dirfin_history,
            },
            "kpi_metrics": kpi_metrics,
            "missions": missions,
            "trace_events": trace_events,
            "budget_lines": budget_lines,
            "facture_statuses": status_catalog.get("facture", []),
            "user_roles": user_roles,
            "role_labels": role_labels,
            "directions": directions,
            "workflow_assignments": workflow_assignments,
            "users": users,
            "appro_statuses": status_catalog.get("appro", []),
            "facturation_statuses": status_catalog.get("facturation", []),
        }

        return AppState.model_validate(state_payload)
