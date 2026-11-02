# Backend Spring Boot : initialisation de la base

## PostgreSQL

Activer le profil `postgres` avec la variable d'environnement
`SPRING_PROFILES_ACTIVE=postgres` (Windows comme Linux), puis définir :

| Variable | Valeur |
| --- | --- |
| `FACTURATION_DB_URL` | URL JDBC, par défaut `jdbc:postgresql://localhost:5432/facturation` |
| `FACTURATION_DB_USERNAME` | Utilisateur PostgreSQL |
| `FACTURATION_DB_PASSWORD` | Mot de passe PostgreSQL |
| `FACTURATION_AUTH_SECRET` | Secret JWT de l'application |
| `FACTURATION_DB_POOL_SIZE` | Taille du pool, par défaut `10` |

La base PostgreSQL doit déjà exister. L'utilisateur doit avoir les droits de
création et de modification des tables dans le schéma cible (par défaut `public`).
Pour un autre schéma existant, ajouter `?currentSchema=nom_du_schema` à l'URL JDBC.
Ne pas stocker les mots de passe dans le dépôt.

À chaque démarrage, Spring Boot exécute Liquibase **avant JPA** :

- une base vide reçoit toutes les tables, contraintes, index et données de référence ;
- les migrations déjà appliquées ne sont pas rejouées ; les données sont conservées ;
- les nouvelles tables et colonnes sont ajoutées par les nouvelles migrations.

`ddl-auto` reste à `none` : Liquibase est le seul responsable du schéma.
Ne pas activer `create`, `create-drop` ou `drop-first` sur une base contenant des données.

**Limite importante :** Liquibase ne répare pas automatiquement une table supprimée
manuellement après sa migration, ni une base partiellement créée hors Liquibase.
Ces cas nécessitent une restauration ou une migration de réparation dédiée ; ne pas
effacer les tables `databasechangelog` / `databasechangeloglock` pour forcer une réexécution.

Les dates `Instant` restent stockées en texte ISO-8601 pour correspondre au
convertisseur JPA existant ; une migration réservée à PostgreSQL adapte ces colonnes.

Les comptes de démonstration ne sont pas créés par défaut avec ce profil.
`FACTURATION_SEED_USERS=true` les active uniquement pour un environnement de test.

## Développement SQLite

Sans profil explicite, le profil `local` reste actif et utilise SQLite comme auparavant.
Le support PostgreSQL n'importe ni ne transfère les données de SQLite.

## Tests du schéma

Le test SQLite utilise une base temporaire et s'exécute avec les tests Gradle habituels.
Pour activer également les tests PostgreSQL, définir `FACTURATION_TEST_POSTGRES_URL`
vers une base de test dédiée initialement vide, ainsi que
`FACTURATION_TEST_POSTGRES_USERNAME` (par défaut `postgres`) et
`FACTURATION_TEST_POSTGRES_PASSWORD` (par défaut vide), puis lancer les tests Gradle.
Ne jamais utiliser une base de production pour ces tests.