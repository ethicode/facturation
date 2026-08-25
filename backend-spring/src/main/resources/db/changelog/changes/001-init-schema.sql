CREATE TABLE IF NOT EXISTS roles (
  code TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  position INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  is_active INTEGER NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT,
  updated_at TEXT,
  last_login_at TEXT
);

CREATE TABLE IF NOT EXISTS user_roles (
  user_id TEXT NOT NULL,
  role_code TEXT NOT NULL,
  position INTEGER NOT NULL,
  PRIMARY KEY (user_id, role_code)
);

CREATE TABLE IF NOT EXISTS directions (
  name TEXT PRIMARY KEY,
  position INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS workflow_assignments (
  step TEXT NOT NULL,
  workflow_type TEXT NOT NULL,
  user_id TEXT NOT NULL,
  position INTEGER NOT NULL,
  PRIMARY KEY (step, workflow_type, user_id)
);

CREATE TABLE IF NOT EXISTS facture_statuses (
  status TEXT PRIMARY KEY,
  position INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS factures (
  id TEXT PRIMARY KEY,
  fournisseur TEXT,
  montant REAL NOT NULL,
  devise TEXT,
  centre_cout TEXT,
  description TEXT,
  echeance TEXT,
  priorite TEXT,
  direction TEXT,
  resume TEXT,
  numero_facture TEXT,
  compte_charge TEXT,
  date_reception TEXT,
  mode_reception TEXT,
  statut TEXT,
  position INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS facture_attachments (
  facture_id TEXT NOT NULL,
  position INTEGER NOT NULL,
  value TEXT NOT NULL,
  PRIMARY KEY (facture_id, position)
);

CREATE TABLE IF NOT EXISTS facture_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  facture_id TEXT NOT NULL,
  position INTEGER NOT NULL,
  at TEXT,
  actor TEXT,
  email TEXT,
  action TEXT,
  role TEXT,
  detail TEXT,
  commentaire TEXT
);

CREATE TABLE IF NOT EXISTS facture_history_attachments (
  history_id INTEGER NOT NULL,
  position INTEGER NOT NULL,
  value TEXT NOT NULL,
  PRIMARY KEY (history_id, position)
);

CREATE TABLE IF NOT EXISTS budgets (
  direction TEXT PRIMARY KEY,
  allocated REAL NOT NULL,
  engaged REAL NOT NULL,
  allocated_by TEXT,
  position INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS tickets (
  id TEXT PRIMARY KEY,
  direction TEXT,
  objet TEXT,
  montant REAL NOT NULL,
  devise TEXT,
  titre_demande TEXT,
  domaine TEXT,
  sous_domaine TEXT,
  action_demande TEXT,
  date_debut_souhaitee TEXT,
  date_fin_souhaitee TEXT,
  direction_demandeur TEXT,
  budget_previsionnel REAL NOT NULL,
  priorite TEXT,
  description TEXT,
  commentaire TEXT,
  fichier_nom TEXT,
  statut TEXT,
  linked_facture_id TEXT,
  position INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS ticket_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket_id TEXT NOT NULL,
  position INTEGER NOT NULL,
  at TEXT,
  actor TEXT,
  email TEXT,
  action TEXT,
  role TEXT,
  detail TEXT,
  commentaire TEXT
);

CREATE TABLE IF NOT EXISTS ticket_history_attachments (
  history_id INTEGER NOT NULL,
  position INTEGER NOT NULL,
  value TEXT NOT NULL,
  PRIMARY KEY (history_id, position)
);

CREATE TABLE IF NOT EXISTS dirfin_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  position INTEGER NOT NULL,
  payload TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS dashboard_kpi (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  position INTEGER NOT NULL,
  payload TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS dashboard_mission (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  position INTEGER NOT NULL,
  payload TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS dashboard_trace_event (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  position INTEGER NOT NULL,
  payload TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS dashboard_budget_line (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  position INTEGER NOT NULL,
  payload TEXT NOT NULL
);
