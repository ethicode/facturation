# Backend FastAPI

API FastAPI pour l'application de facturation et d'approvisionnement.

## Installation

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Lancement

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Endpoints principaux

- `GET /health`
- `GET /api/dashboard`
- `GET /api/meta/workflow`
- `GET /api/factures`
- `GET /api/factures/{facture_id}`
- `POST /api/factures`
- `PATCH /api/factures/{facture_id}/status`
- `GET /api/appro`
- `POST /api/appro/budgets`
- `DELETE /api/appro/budgets/{direction}`
- `POST /api/appro/tickets`
- `POST /api/appro/tickets/{ticket_id}/verify`
- `POST /api/appro/tickets/{ticket_id}/transfer`
- `POST /api/appro/tickets/{ticket_id}/close`

Les donnees sont initialisees depuis un seed local puis persistees dans `data/app.sqlite3`.