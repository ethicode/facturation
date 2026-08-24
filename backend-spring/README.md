# Backend Spring Boot - Facturation

Backend Java 21 cree a partir du frontend React et du backend Python existants.

## Architecture microservice (multi-modules Maven)

- `api`: couche HTTP (controllers, security, Swagger, upload, CORS)
- `core`: logique metier et modeles
- `gateways`: acces persistance (SQLite) via gateway

## Stack

- Java 21
- Spring Boot 3
- SQLite (`jdbc:sqlite`)
- Liquibase (migration schema)
- Swagger/OpenAPI (`/swagger-ui.html`)

## Demarrage

```bash
cd backend-spring
mvn -pl api -am spring-boot:run
```

L'API demarre sur `http://localhost:8080`.

## Swagger

- UI: `http://localhost:8080/swagger-ui.html`
- OpenAPI JSON: `http://localhost:8080/v3/api-docs`

## Donnees

- Base SQLite: `data/app-spring.sqlite3`
- Uploads: `data/uploads/`

## Auth seed

Utilisateur admin cree automatiquement au premier demarrage:

- username: `admin`
- password: `admin123`

## Endpoints couverts (compatibles frontend)

- `/health`
- `/api/auth/login`, `/api/auth/me`
- `/api/dashboard`
- `/api/meta/workflow`
- `/api/workflow/tasks`
- `/api/factures`, `/api/factures/{id}`, `/api/factures/{id}/status`
- `/api/appro`, `/api/appro/budgets`, `/api/appro/tickets`, `/api/appro/tickets/{id}/verify`, `/api/appro/tickets/{id}/close`
- `/api/admin/directions`, `/api/admin/roles`, `/api/admin/users`, `/api/admin/workflow-assignments`
- `/api/uploads`

## Notes

- La securite est geree par token Bearer signe HMAC (compatible avec les besoins actuels du frontend).
- La persistance est centralisee dans une table `app_state` (JSON) pour accelerer la migration depuis le backend Python tout en restant sur SQLite + Liquibase.
