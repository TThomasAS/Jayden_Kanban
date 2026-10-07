# Jaydee Kanban – API (`visiplus`)

**Version 1.1.0** · Node.js 20 · Express 5 · TypeScript · MongoDB 7

## Présentation et contexte

Jaydee fabrique des pièces plastiques par injection. **Jaydee Kanban** est l'application interne de suivi de la production : les **ordres de fabrication (OF)** sont des cartes déplacées entre des **colonnes** (À faire, En cours, Terminé…) afin de visualiser l'avancement et les priorités.

Ce dépôt contient l'API REST. Le travail réalisé prépare sa **mise en production sécurisée** : tests d'intégration, conteneurisation Docker, stratégie CI/CD, sécurisation et documentation.

## Démarrage rapide

```bash
npm ci
cp .env.example .env        # renseigner JWT_SECRET (≥ 32 caractères) et MONGODB_URI
npm run dev                 # http://localhost:3000/health
```

Avec Docker (API + MongoDB) :

```bash
cp .env.example .env
docker compose up -d --build
```

Tests : `npm test` (50 tests, MongoDB en mémoire). Détails complets : **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)**.

## Scripts

| Commande | Rôle |
|---|---|
| `npm run dev` | Développement avec rechargement (tsx) |
| `npm run build` | Compilation `src/` → `dist/` |
| `npm start` | Lancement de la version compilée |
| `npm test` / `npm run test:watch` / `npm run test:coverage` | Tests Vitest + Supertest |
| `npm run typecheck` | Vérification TypeScript (sources + tests) |

## API

Toutes les routes `/api/columns` et `/api/ofs` exigent un en-tête `Authorization: Bearer <token>` (sinon **401**).

| Méthode | Route | Description |
|---|---|---|
| GET | `/health` | État du serveur (public) |
| POST | `/api/auth/register` · `/api/auth/login` | Création de compte / connexion → token JWT (public, limité à 10 req / 15 min) |
| GET, POST | `/api/columns` | Lister / créer une colonne |
| GET, PUT, DELETE | `/api/columns/:id` | Lire / modifier / supprimer une colonne |
| GET, POST | `/api/ofs` (`?columnId=`) | Lister / créer un OF |
| GET, PUT, DELETE | `/api/ofs/:id` | Lire / modifier / supprimer un OF |
| PATCH | `/api/ofs/:id/move` | Déplacer un OF (colonne et/ou position) |

## Structure

```
├── src/
│   ├── main.ts / app.ts / server.ts   # entrée, config Express, démarrage
│   ├── config/        # env (validation Zod), db (Mongoose), logger (Pino)
│   ├── models/        # User, Column, OF
│   ├── routes/        # auth, columns, ofs
│   ├── controllers/   # logique métier
│   └── middlewares/   # auth JWT, validation, erreurs, security (helmet + rate limit)
├── tests/             # app, auth, columns, ofs, security (+ setup, helpers)
├── .github/workflows/ci.yml
├── Dockerfile · .dockerignore · docker-compose.yml · .env.example
├── ANALYSE_EXISTANT.md · CI_CD_STRATEGIE.md · DEPLOYMENT_GUIDE.md · NOTE_SECURITE.md
└── tsconfig.json (IDE + tests) · tsconfig.build.json (production) · vitest.config.ts
```

## Choix techniques

- **Tests** : Vitest + Supertest sur l'application Express réelle (`createApp()`), base MongoDB Memory Server isolée et nettoyée après chaque test ; variable `MONGO_TEST_URI` pour utiliser un MongoDB de CI.
- **Build** : `tsconfig.build.json` dédié (seul `src/` est compilé) ; `npm test` en exécution unique (compatible CI).
- **Docker** : image multi-étapes `node:20-alpine`, dépendances de production seules, utilisateur non-root, `HEALTHCHECK` ; Compose avec MongoDB 7, volume persistant et démarrage conditionné à la santé de la base.
- **CI/CD** : GitHub Actions – typecheck, audit, tests, build, image Docker ; recette sur `main`, production sur *release* avec approbation manuelle (voir [CI_CD_STRATEGIE.md](CI_CD_STRATEGIE.md)).

## Sécurité

- **Helmet** : en-têtes HTTP de sécurité, `X-Powered-By` masqué.
- **express-rate-limit** : 300 req / 15 min sur `/api`, 10 req / 15 min sur `/api/auth` (anti brute force) → 429.
- Authentification **JWT** (401 sans token valide), mots de passe hachés **bcrypt**, validation **Zod** avec filtrage des champs, payload limité à 100 ko.
- Secrets hors dépôt (`.env`), URI MongoDB non journalisée, dépendances à jour (**0 vulnérabilité**).

Détails, vérifications et limites : **[NOTE_SECURITE.md](NOTE_SECURITE.md)**.

## Auteurs et version

- **Thomas Tissier** – préparation de la mise en production (tests, Docker, CI/CD, sécurité, documentation)
- Code initial : équipe de développement Jaydee

| Version | Date | Changements |
|---|---|---|
| 1.1.0 | 29/09/2026 | Tests colonnes et sécurité, Helmet + rate limiting, Docker, CI/CD, documentation, correctifs build/tests, dépendances à jour |
| 1.0.0 | – | Version initiale de l'API |
