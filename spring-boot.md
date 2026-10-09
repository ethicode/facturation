# Entités JPA à créer pour le backend Spring Boot

Cette proposition reprend les modèles et la persistance SQLite du backend actuel (`backend/app/schemas.py` et `backend/app/storage.py`). Les noms de tables ci-dessous sont indicatifs : ils peuvent être conservés pour faciliter une migration des données.

## 1. Entités métier principales

### Facturation

#### `Facture` → `factures`

- `id` : identifiant métier (clé primaire, chaîne)
- `fournisseur`, `montant` (`BigDecimal`), `devise`
- `centreCout`, `description`, `echeance`, `priorite`, `direction`, `resume`
- `numeroFacture`, `compteCharge`, `dateReception`, `modeReception`
- `statut`
- Relations :
	- `@OneToMany(mappedBy = "facture", cascade = ALL, orphanRemoval = true)` vers `FactureHistorique`
	- `@OneToMany` vers `FacturePieceJointe` pour les fichiers déposés à la création

#### `FactureHistorique` → `facture_history`

- `id` (clé primaire), `at` (`Instant`), `actor`, `email`, `action`, `role`, `detail`, `commentaire`
- `@ManyToOne` vers `Facture`
- `@OneToMany` vers `FactureHistoriquePieceJointe`

Créer une ligne d’historique pour chaque transition/commentaire. L’historique est ordonné chronologiquement ; il ne faut pas écraser l’étape précédente.

### Gestion budgétaire

#### `BudgetDirection` → `appro_budgets`

- `direction` (clé primaire ou identifiant technique), `allocated`, `engaged` (`BigDecimal`), `allocatedBy`
- `@OneToMany(mappedBy = "budgetDirection")` vers `LigneBudgetaire`

#### `LigneBudgetaire` → `appro_budget_items`

- `id`, `label`, `allocated` (`BigDecimal`), `createdAt`, `createdBy`, `updatedAt`, `updatedBy`
- `@ManyToOne` vers `BudgetDirection`
- C’est cette entité qui alimente la liste « Lignes budgétaires » et le champ « Budget concerné » du formulaire de mission.

#### `HistoriqueBudget` → `dirfin_history`

- `id`, `at` (`Instant`), `actor`, `action`, `detail`
- Événements d’audit pour création/modification/suppression d’allocations et de lignes budgétaires.

### Approvisionnement

#### `TicketApprovisionnement` → `appro_tickets`

- `id`, `objet`, `montant` (`BigDecimal`), `devise`, `titreDemande`
- `domaine`, `sousDomaine`, `actionDemande`
- `dateDebutSouhaitee`, `dateFinSouhaitee`, `directionDemandeur`, `budgetPrevisionnel`
- `priorite`, `description`, `commentaire`, `fichierNom`, `statut`, `linkedFactureId`
- `@ManyToOne` vers `BudgetDirection` si le ticket doit référencer une direction budgétaire au lieu de garder seulement son nom
- `@OneToMany` vers `TicketApprovisionnementHistorique`

#### `TicketApprovisionnementHistorique` → `appro_ticket_history`

- `id`, `at` (`Instant`), `actor`, `email`, `action`, `role`, `detail`, `commentaire`
- `@ManyToOne` vers `TicketApprovisionnement`
- `@OneToMany` vers `TicketHistoriquePieceJointe`

#### `DomaineApprovisionnement` et `SousDomaineApprovisionnement`

- Tables `appro_domains` et `appro_subdomains`
- `DomaineApprovisionnement` possède plusieurs sous-domaines (`@OneToMany`).
- `SousDomaineApprovisionnement` référence son domaine (`@ManyToOne`) ; rendre le nom unique à l’intérieur du domaine.

### Frais de mission

#### `Mission` → `missions`

- `code` (clé primaire), `objetMission`, `destination`, `pays`
- `dateDepart`, `dateRetour`, `montantEstimatif` (`BigDecimal`), `statut`
- Relations : `@ManyToOne` vers `LigneBudgetaire` et `@OneToMany` vers `MissionPieceJointe`

**Amélioration recommandée par rapport au backend actuel :** aujourd’hui `budget_concerne` est une simple chaîne (par exemple « Direction — libellé »). Dans Spring Boot, remplacer cette chaîne par une clé étrangère `budget_item_id` vers `LigneBudgetaire`. Le formulaire peut transmettre l’identifiant de la ligne sélectionnée ; le backend conserve alors une relation vérifiable, même si son libellé change.

## 2. Entités d’authentification et de workflow

### `Utilisateur` → `users`

- `id`, `username`, `fullName`, `firstName`, `lastName`, `email`
- `employeeId`, `department`, `jobTitle`, `phoneNumber`, `managerId`
- `locale`, `timezone`, `passwordHash`, `isActive`, `status`
- `createdAt`, `updatedAt`, `lastLoginAt`
- Rôles en relation `@ManyToMany` avec `Role`, via `user_roles`.
- Ne jamais exposer `passwordHash` dans les DTO de réponse.

### `Role` → `roles`

- `code` (clé), `label`
- Relation `@ManyToMany(mappedBy = "roles")` vers `Utilisateur`.

### `AffectationWorkflow` → `workflow_assignments`

- `id` ou clé composée (`workflowType`, `step`, `userId`)
- `workflowType`, `step`
- Relations `@ManyToOne` vers `Utilisateur` ; index/contrainte unique sur workflow, étape et utilisateur.

Les définitions et transitions des workflows sont actuellement configurées dans les fichiers JSON du projet. Elles peuvent rester des fichiers de configuration au début ; seules les affectations effectives sont persistées en base.

## 3. Entités de support

- **Pièces jointes** : utiliser une entité par relation (`FacturePieceJointe`, `FactureHistoriquePieceJointe`, `TicketHistoriquePieceJointe`, `MissionPieceJointe`) avec `id`, `fileName`/clé de stockage, type MIME éventuel, taille, date d’ajout, et relation `@ManyToOne`. Les fichiers binaires restent sur disque ou dans un stockage objet, pas dans les colonnes JPA.
- **`Direction`** → `directions` : à créer si les directions doivent être gérées comme référentiel et référencées par clé étrangère ; sinon le nom est actuellement stocké dans plusieurs entités.
- **`KpiMetric`** → `kpi_metrics` : `label`, `value`, `trend`, `tone`. Si les indicateurs peuvent être recalculés depuis les données métier, préférer des requêtes/projections plutôt qu’une table redondante.
- **`BudgetOverview`** → `budget_lines` et **`TraceEvent`** → `trace_events` : données de tableau de bord / traçabilité actuelles ; les garder uniquement si elles ne sont pas recalculées ou si elles ont une fonction métier requise.
- **`StatusCatalog`** → `status_catalog` : `workflow`, `status`, `position`, clé unique (`workflow`, `status`). Peut être évité si les statuts restent des enums/constants versionnés avec le code.

## 4. Relations principales

```text
Utilisateur *──* Role
Utilisateur 1──* AffectationWorkflow (étape identifiée par workflowType + step)
Facture 1──* FactureHistorique 1──* FactureHistoriquePieceJointe
Facture 1──* FacturePieceJointe
BudgetDirection 1──* LigneBudgetaire
Mission *──1 LigneBudgetaire
TicketApprovisionnement 1──* TicketApprovisionnementHistorique 1──* TicketHistoriquePieceJointe
DomaineApprovisionnement 1──* SousDomaineApprovisionnement
HistoriqueBudget (journal d’audit autonome)
```

## 5. Types et conventions JPA

- Montants : `BigDecimal`, avec précision/échelle explicites (`@Column(precision = 19, scale = 2)`), jamais `float`/`double`.
- Dates/horodatages : `LocalDate` pour dates métier sans heure ; `Instant` (stocké UTC) pour événements et audit.
- Utiliser des DTO distincts des entités (`FactureCreateRequest`, `FactureResponse`, etc.) et des services transactionnels (`@Transactional`).
- Éviter `CascadeType.REMOVE` sur des référentiels partagés tels que `Utilisateur`, `Role`, `BudgetDirection` et `LigneBudgetaire` ; choisir les cascades selon la propriété réelle des données.
- Conserver des contraintes `NOT NULL`, unicité et index sur les références métier ; indexer les clés étrangères et les champs de recherche fréquente (`statut`, dates, direction).

## 6. Correspondance avec le backend actuel

Les contrats Pydantic sont dans [backend/app/schemas.py](backend/app/schemas.py) et les tables SQLite ainsi que leurs relations sont décrites dans [backend/app/storage.py](backend/app/storage.py). Les entités prioritaires pour une première migration sont : `Utilisateur`, `Role`, `Facture`, `FactureHistorique`, les entités de pièces jointes, `BudgetDirection`, `LigneBudgetaire`, `Mission`, `TicketApprovisionnement`, leurs historiques, les domaines/sous-domaines et `AffectationWorkflow`.
