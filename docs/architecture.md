# Architecture — Task Manager

Document de référence du projet. Il fixe les décisions techniques avant écriture du code et
sert de contrat pour l'ensemble des livrables (backend, frontend web, mobile, CI/CD).

---

## 1. Vue d'ensemble

Application de gestion de tâches en trois clients partageant une même API REST.

```
┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│  Web React  │   │   Flutter   │   │   Swagger   │
│  Vite + TS  │   │   (bonus)   │   │     UI      │
└──────┬──────┘   └──────┬──────┘   └──────┬──────┘
       │                 │                 │
       └────────── HTTPS / JWT ────────────┘
                         │
              ┌──────────▼──────────┐
              │   Spring Boot API   │
              │  auth · tasks ·     │
              │  reports            │
              └──────────┬──────────┘
                         │ JPA
                  ┌──────▼──────┐
                  │    MySQL    │
                  └─────────────┘
```

API stateless : aucune session serveur, l'état d'authentification tient entièrement dans le
jeton porté par le client. C'est ce qui permet aux trois clients de consommer la même API sans
traitement particulier, et au service d'être répliqué horizontalement sans session partagée.

### Stack

| Couche | Technologies |
|---|---|
| Backend | Java 21, Spring Boot 3.x, Spring Data JPA, Spring Security, springdoc-openapi |
| Base de données | MySQL 8 |
| Frontend web | React 19, Vite, TypeScript, Tailwind CSS 4 |
| Mobile | Flutter / Dart (bonus) |
| Conteneurisation | Docker, Docker Compose |
| CI/CD | GitHub Actions |
| Déploiement | Google Cloud Run (bonus) |

### Organisation du dépôt

```
task-manager/
├── backend/
├── frontend/
├── mobile/                 (bonus)
├── docs/architecture.md
├── docker-compose.yml
├── .github/workflows/
└── README.md
```

Monorepo : un seul historique Git, une seule CI, un `docker compose up` pour tout démarrer.

---

## 2. Modèle de domaine

### Entités

**User** — id, email (unique), password (BCrypt), createdAt, updatedAt.

**Task** — id, title, description, status, importance, urgency, completedAt, user, createdAt,
updatedAt.

Toutes deux héritent d'une `BaseEntity` portant les horodatages, alimentés par l'audit JPA
(`@EnableJpaAuditing`) plutôt qu'assignés manuellement.

### Énumérations

| Enum | Valeurs |
|---|---|
| `TaskStatus` | `TODO`, `IN_PROGRESS`, `DONE` |
| `Importance` | `IMPORTANT`, `NOT_IMPORTANT` |
| `Urgency` | `URGENT`, `NOT_URGENT` |
| `Quadrant` | `DO_FIRST`, `SCHEDULE`, `DELEGATE`, `DROP` (dérivé) |

Le statut est une énumération, pas une chaîne libre : les valeurs possibles sont connues à la
compilation, documentées automatiquement par OpenAPI, et une valeur invalide est rejetée en
désérialisation plutôt qu'en base.

### Classement des tâches — décision structurante

Chaque tâche porte deux qualificatifs, un par axe : importance et urgence. La règle métier
interdit les paires contradictoires — une tâche ne peut pas être à la fois importante et non
importante.

**Deux champs enum distincts et obligatoires, et non une collection de badges.**

Avec deux axes séparés, une combinaison contradictoire est *impossible à représenter*. Aucune
validation applicative n'est nécessaire pour l'interdire : la structure des données s'en charge.
Une collection de badges aurait exigé un validateur personnalisé, donc une règle vivant dans le
code plutôt que dans le modèle — contournable par tout point d'entrée qui l'oublierait.

Les deux champs sont obligatoires en création : une tâche sans classement n'existe pas.

### Quadrant dérivé

Le croisement des deux axes donne quatre quadrants, qui correspondent à la matrice
d'Eisenhower :

| importance | urgency | quadrant | Action |
|---|---|---|---|
| `IMPORTANT` | `URGENT` | `DO_FIRST` | Traiter immédiatement |
| `IMPORTANT` | `NOT_URGENT` | `SCHEDULE` | Planifier |
| `NOT_IMPORTANT` | `URGENT` | `DELEGATE` | Déléguer |
| `NOT_IMPORTANT` | `NOT_URGENT` | `DROP` | Abandonner |

Le quadrant est **calculé, jamais persisté**. Il est exposé en lecture dans les réponses,
jamais accepté en écriture. Le persister créerait une donnée dénormalisée pouvant diverger de
ses deux sources.

### `completedAt`

Champ nullable, renseigné lors du passage à `DONE`, remis à `null` si le statut en sort.

C'est ce champ, et non `updatedAt`, qui sert de base aux rapports : `updatedAt` change à chaque
modification et ne permettrait pas de savoir *quand* une tâche a réellement été achevée.

---

## 3. Découpage du backend

Découpage **par domaine**, pas par type technique.

```
com.taskmanager/
├── config/          SecurityConfig, OpenApiConfig, JpaAuditingConfig
├── security/        JwtService, JwtAuthenticationFilter, CustomUserDetailsService,
│                    RefreshToken, RefreshTokenService, RefreshCookie
├── user/            User, UserRepository, AuthController, AuthService, dto/
├── task/            Task, TaskStatus, Importance, Urgency, Quadrant,
│                    TaskRepository, TaskController, TaskService, dto/
├── report/          ReportController, ReportService, PeriodResolver, dto/
└── common/          GlobalExceptionHandler, ApiError, BaseEntity, exception/
```

Un découpage `controllers/ services/ repositories/` regroupe les fichiers par nature technique
et disperse chaque fonctionnalité dans trois dossiers. Le découpage par domaine rassemble tout
ce qui concerne une notion au même endroit : une fonctionnalité se lit, se teste et se supprime
d'un bloc.

### Règles transverses

1. **Aucune entité JPA exposée dans un controller.** DTO en entrée, DTO en sortie. L'entité est
   un détail de persistance ; l'exposer couple le contrat d'API au schéma de base et fait fuiter
   des champs non destinés au client.
2. **Logique métier dans les services.** Le controller valide, délègue, retourne.
3. **Gestion des erreurs centralisée** dans un `@RestControllerAdvice`. Aucun try/catch dispersé.
4. **Secrets par variables d'environnement.** Aucun secret dans un fichier versionné.

---

## 4. Sécurité

### Authentification

JWT signé HS256, transmis en `Authorization: Bearer <token>`. Mots de passe hachés en BCrypt.
Sessions Spring Security en `STATELESS`.

**Access token court (15 min) + refresh token rotatif (30 jours).** L'access token porte
l'authentification des appels ; le refresh token sert uniquement à en obtenir un nouveau.

Le refresh token transite par un cookie `httpOnly`, `SameSite=Strict`, `Path=/api/auth` : il est
inaccessible au JavaScript, donc une XSS n'emporte que l'access token court-vivant. Il est
stocké en base sous forme d'empreinte SHA-256, jamais en clair.

Chaque usage le consomme et en émet un nouveau (rotation). Présenter un jeton **déjà consommé**
trahit l'existence d'une copie : le serveur révoque alors toute la famille de rotation, y
compris le jeton courant du porteur légitime — on ne peut pas distinguer la victime de
l'attaquant, donc on coupe les deux.

Le stockage en base est ce qui rend la révocation et la détection de rejeu possibles. Un refresh
*stateless* éviterait la table mais rendrait le logout purement cosmétique et le vol
indétectable.

Chaîne de filtres : `JwtAuthenticationFilter` placé avant
`UsernamePasswordAuthenticationFilter`, extrait le sujet du jeton, charge l'utilisateur et
peuple le `SecurityContext`.

Routes publiques : `/api/auth/**`, `/swagger-ui/**`, `/v3/api-docs/**`. Tout le reste est
authentifié par défaut — liste blanche, jamais liste noire.

### Autorisation et isolation des données

**Toute requête sur une tâche filtre par propriétaire**, au niveau du repository :

```java
taskRepository.findByIdAndUserId(id, currentUserId)
```

Jamais `findById(id)` suivi d'une vérification en Java — la contrainte vit dans la requête,
pas dans un contrôle qu'on peut oublier d'écrire.

L'identité de l'utilisateur courant provient exclusivement du `SecurityContext`, jamais d'un
paramètre de requête ou d'un champ du corps.

**404 et non 403** sur une ressource appartenant à un autre utilisateur : répondre 403
confirmerait l'existence de la ressource et permettrait d'énumérer les identifiants valides.

### Stockage du jeton côté client

Les deux jetons ne sont pas stockés de la même façon, parce qu'ils n'ont pas la même valeur.

**Access token en `localStorage`.** Vulnérable au XSS, limite assumée — mais il expire en
15 minutes, donc le butin est faible et périssable.

**Refresh token en cookie `httpOnly`**, `SameSite=Strict`, `Path=/api/auth`. C'est lui qui vaut
30 jours d'accès, donc c'est lui qu'on met hors de portée du JavaScript. Le `Path` limite son
envoi aux routes d'authentification, réduisant d'autant la surface CSRF ; `SameSite=Strict`
couvre le reste. Le frontend étant servi en même origine que l'API (proxy Vite en dev, nginx en
production), le cookie fonctionne sans configuration CORS.

Côté Flutter, stockage sécurisé natif (`flutter_secure_storage`).

---

## 5. Contrat d'API

Base : `/api`.

### Endpoints

| Méthode | Route | Description |
|---|---|---|
| POST | `/api/auth/register` | Inscription |
| POST | `/api/auth/login` | Connexion, renvoie le JWT |
| POST | `/api/auth/refresh` | Rotation du refresh token |
| POST | `/api/auth/logout` | Révocation de la famille de jetons |
| GET | `/api/tasks` | Liste paginée, filtrée, recherchée |
| POST | `/api/tasks` | Création |
| GET | `/api/tasks/{id}` | Détail |
| PUT | `/api/tasks/{id}` | Modification |
| DELETE | `/api/tasks/{id}` | Suppression |
| GET | `/api/reports/summary` | Indicateurs de synthèse sur une période |
| GET | `/api/reports/trend` | Série temporelle des tâches terminées |
| GET | `/api/reports/quadrants` | Répartition des tâches terminées par quadrant |
| GET | `/api/reports/distribution` | Répartition des tâches ouvertes par quadrant |
| GET | `/api/reports/heatmap` | Tâches terminées par jour sur une année |

### Pagination, filtrage et recherche

`GET /api/tasks?page=&size=&status=&importance=&urgency=&quadrant=&search=`

**Exécutés en base, jamais côté client.** Filtrer en JavaScript sur un tableau déjà chargé
fonctionne sur trente tâches et s'effondre sur trois mille. Le filtre `quadrant` est traduit
dans le service en couple (importance, urgency).

Réponse paginée standard Spring : `content`, `totalElements`, `totalPages`, `number`, `size`.

### Format d'erreur unique

```json
{
  "timestamp": "2026-09-17T14:23:11Z",
  "status": 400,
  "message": "Validation failed",
  "errors": { "title": "must not be blank" }
}
```

Un seul format pour toutes les erreurs : le client écrit une fois la logique de traitement.

### Documentation

springdoc-openapi, Swagger UI sur `/swagger-ui.html`, schéma de sécurité `bearerAuth` déclaré
pour permettre l'essai des endpoints authentifiés depuis l'interface. Controllers annotés par
`@Tag` (auth, tasks, reports) et `@Operation` avec un résumé d'une ligne.

---

## 6. Rapports

Domaine en lecture seule, restreint à l'utilisateur courant au même titre que les tâches.

### Périodes

`DAILY`, `WEEKLY`, `MONTHLY`, `YEARLY`. Le pas de la série temporelle s'adapte : heure pour
`DAILY`, jour pour `WEEKLY` et `MONTHLY`, mois pour `YEARLY`.

### Contraintes

**Agrégation en base.** Requêtes JPQL ou natives avec `GROUP BY`. Charger toutes les tâches en
mémoire pour les compter dans une boucle Java est proscrit : le coût croît linéairement avec
l'historique.

**Séries complètes.** Les intervalles sans donnée sont renvoyés à zéro, pas omis. Compléter la
série est la responsabilité du backend — sinon chaque client réimplémente la même logique de
remplissage, et les graphiques se désalignent.

**Fuseau horaire explicite.** Paramètre `zone` optionnel (ex. `Africa/Douala`), UTC par défaut.
Les bornes de journée et de semaine sont calculées dans ce fuseau. Sans cela, un rapport
quotidien est décalé pour tout utilisateur hors UTC.

Le calcul des bornes est isolé dans un `PeriodResolver` testable indépendamment des requêtes.

---

## 7. Frontend web

```
src/
├── api/          client.ts, authApi.ts, taskApi.ts, reportApi.ts
├── auth/         AuthContext, useAuth, ProtectedRoute
├── features/
│   ├── tasks/    TaskList, TaskMatrix, TaskForm, TaskFilters, QuadrantSelector, useTasks
│   └── reports/  ReportsPage, PeriodSelector, TrendChart, QuadrantChart, Heatmap
├── components/ui/
└── types/        miroir des DTO backend
```

Instance HTTP unique avec intercepteurs : injection du jeton en requête, redirection vers
`/login` sur 401 en réponse. La logique d'authentification vit à un seul endroit.

Les types TypeScript reflètent les DTO du backend. Toute divergence de contrat devient une
erreur de compilation plutôt qu'un bug à l'exécution.

**Sélecteur de quadrant** : grille 2×2 sur laquelle l'utilisateur choisit une case unique,
qui renseigne les deux axes simultanément. Deux listes déroulantes séparées permettraient de
composer une saisie que le backend rejetterait ; la grille rend l'état invalide inatteignable
depuis l'interface. Le principe est le même que côté modèle de données : rendre l'erreur
impossible plutôt que la détecter.

**Vue matrice** : alternative à la liste, grille 2×2 (urgence en abscisse, importance en
ordonnée) avec les tâches réparties par quadrant.

---

## 8. Infrastructure

### Docker

Dockerfiles **multi-stage** pour les deux applications : build Maven puis JRE seul côté
backend, build Vite puis nginx statique côté frontend. L'image finale ne contient pas la
chaîne de compilation.

`docker-compose.yml` : MySQL avec healthcheck et volume persistant, backend démarrant une fois
la base saine, frontend. Un `docker compose up` suffit à démarrer l'ensemble.

Variables d'environnement : `.env.example` versionné, `.env` ignoré.

### CI/CD

GitHub Actions, trois jobs :

1. Build et tests du backend (Maven, MySQL en service).
2. Build du frontend (typecheck, lint, build Vite).
3. Build et publication des images, puis déploiement Cloud Run — sur `main` uniquement.

---

## 9. Journal des décisions

| Décision | Alternative écartée | Raison |
|---|---|---|
| Découpage par domaine | Par type technique | Une fonctionnalité se lit et se supprime d'un bloc |
| Deux axes enum | Collection de badges | Rend la paire contradictoire irreprésentable |
| Quadrant dérivé | Quadrant persisté | Évite une donnée dénormalisée pouvant diverger |
| `completedAt` dédié | `updatedAt` | `updatedAt` change à chaque modification |
| 404 sur ressource étrangère | 403 | Ne révèle pas l'existence de la ressource |
| Filtrage et agrégation en base | Côté client | Ne tient pas à l'échelle |
| Séries complétées côté serveur | Complétées par le client | Évite de dupliquer la logique par client |
| `localStorage` pour l'access token | Cookie `httpOnly` | Compromis assumé ; jeton court-vivant |
| Refresh en cookie `httpOnly` | Refresh en `localStorage` | Inaccessible au JavaScript, donc hors de portée d'une XSS |
| Refresh stocké en base | Refresh *stateless* signé | Rend la révocation et la détection de rejeu possibles |
| Rotation + révocation de famille | Jeton réutilisable | Un rejeu trahit une copie ; on coupe toute la lignée |
| Grille 2×2 de saisie | Deux listes déroulantes | Rend l'état invalide inatteignable |

---

## 10. Hors périmètre

Non implémenté, et assumé comme tel : rôles et permissions, partage de tâches
entre utilisateurs, notifications, pièces jointes, tâches récurrentes, corbeille, export des
rapports côté serveur, internationalisation.
