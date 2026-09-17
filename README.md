# Task Manager — API REST

Backend de gestion de tâches avec classement selon la matrice d'Eisenhower et rapports
d'activité. API REST stateless authentifiée par JWT.

Document de conception détaillé : [`docs/architecture.md`](docs/architecture.md).

## Stack

| Couche | Technologie |
|---|---|
| Langage | Java 21 |
| Framework | Spring Boot 3.5.16 |
| Persistance | Spring Data JPA, MySQL 8 |
| Sécurité | Spring Security, JWT (jjwt 0.13.0), BCrypt |
| Documentation | springdoc-openapi 2.9.1 |
| Build | Maven (wrapper versionné) |
| Conteneurisation | Docker, Docker Compose |
| Tests | JUnit 5, MockMvc, H2 |

## Installation

### Prérequis

- JDK 21 (le build cible explicitement la version 21)
- Docker et Docker Compose, ou une instance MySQL 8 accessible

Maven n'a pas besoin d'être installé : le wrapper `./mvnw` est versionné dans le dépôt et
télécharge la version de Maven définie dans `.mvn/wrapper/maven-wrapper.properties`.

### Lancement avec Docker

```bash
cp .env.example .env    # puis renseigner les valeurs
docker compose up --build
```

MySQL démarre avec un healthcheck et un volume persistant ; le backend attend que la base soit
saine avant de démarrer.

### Lancement en local

```bash
export JWT_SECRET='au-moins-32-octets-de-secret-aleatoire'
export MYSQL_PASSWORD='votre-mot-de-passe'
cd backend && ./mvnw spring-boot:run
```

Le profil `dev` est actif par défaut et se connecte à `localhost:3306`.

### Tests

```bash
cd backend && ./mvnw verify
```

63 tests : unitaires sur le calcul des périodes, intégration sur les endpoints avec base H2 en
mémoire.

## Variables d'environnement

Aucun secret n'est versionné. Le secret JWT n'a **pas** de valeur par défaut : l'application
refuse de démarrer sans lui, et rejette une clé de moins de 32 octets (minimum HS256).

| Variable | Requis | Défaut | Rôle |
|---|---|---|---|
| `JWT_SECRET` | oui | — | Clé de signature HS256, 32 octets minimum |
| `JWT_EXPIRATION_MINUTES` | non | `120` | Durée de vie du jeton |
| `MYSQL_DATABASE` | oui | `taskmanager` (dev) | Nom de la base |
| `MYSQL_USER` | oui | `root` (dev) | Utilisateur |
| `MYSQL_PASSWORD` | oui | — | Mot de passe |
| `MYSQL_HOST` | non | `localhost` (dev), `mysql` (docker) | Hôte |
| `MYSQL_PORT` | non | `3306` | Port |
| `MYSQL_ROOT_PASSWORD` | oui (docker) | — | Mot de passe root du conteneur |
| `BACKEND_PORT` | non | `8080` | Port exposé |

## Documentation de l'API

Swagger UI : <http://localhost:8080/swagger-ui.html> — schéma OpenAPI :
`/v3/api-docs`. Le schéma de sécurité `bearerAuth` est déclaré, ce qui permet d'essayer les
endpoints authentifiés directement depuis l'interface.

## Endpoints

Base : `/api`. Toutes les routes sauf `/api/auth/**` exigent un en-tête
`Authorization: Bearer <token>`.

| Méthode | Route | Description |
|---|---|---|
| POST | `/api/auth/register` | Inscription, renvoie un JWT |
| POST | `/api/auth/login` | Connexion, renvoie un JWT |
| GET | `/api/tasks` | Liste paginée, filtrée, recherchée |
| POST | `/api/tasks` | Création |
| GET | `/api/tasks/{id}` | Détail |
| PUT | `/api/tasks/{id}` | Modification |
| DELETE | `/api/tasks/{id}` | Suppression |
| GET | `/api/reports/summary` | Indicateurs de synthèse et variation |
| GET | `/api/reports/trend` | Série temporelle des tâches terminées |
| GET | `/api/reports/quadrants` | Tâches terminées par quadrant sur la période |
| GET | `/api/reports/distribution` | Tâches ouvertes par quadrant, à l'instant présent |
| GET | `/api/reports/heatmap` | Tâches terminées par jour sur une année |

Paramètres de `GET /api/tasks` :
`?page=&size=&status=&importance=&urgency=&quadrant=&search=`

Paramètres des rapports : `?period=DAILY|WEEKLY|MONTHLY|YEARLY` et `zone` optionnel
(ex. `Africa/Douala`, UTC par défaut). `heatmap` prend `?year=`.

### Format d'erreur

Toutes les erreurs partagent une enveloppe unique, pour que le client n'écrive la logique de
traitement qu'une fois :

```json
{
  "timestamp": "2026-09-17T14:23:11Z",
  "status": 400,
  "message": "validation failed",
  "errors": { "importance": "must not be null" }
}
```

`errors` est omis quand l'erreur ne porte pas sur des champs.

## Architecture

Découpage **par domaine** :

```
com.taskmanager/
├── config/     SecurityConfig, OpenApiConfig, JpaAuditingConfig
├── security/   JwtService, JwtAuthenticationFilter, CustomUserDetailsService
├── user/       User, UserRepository, AuthController, AuthService, dto/
├── task/       Task, TaskStatus, Importance, Urgency, Quadrant,
│               TaskRepository, TaskController, TaskService, dto/
├── report/     ReportController, ReportService, PeriodResolver, dto/
└── common/     GlobalExceptionHandler, ApiError, BaseEntity, exception/
```

Règles transverses : aucune entité JPA exposée dans un controller (DTO en entrée et en sortie),
logique métier dans les services, gestion des erreurs centralisée dans un
`@RestControllerAdvice`.

## Choix techniques

### Découpage par domaine plutôt que par type technique

Un découpage `controllers/ services/ repositories/` regroupe les fichiers par nature et
disperse chaque fonctionnalité dans trois dossiers. Le découpage par domaine rassemble tout ce
qui concerne une notion au même endroit : une fonctionnalité se lit, se teste et se supprime
d'un bloc.

### Deux axes enum, et non une collection de badges

Chaque tâche porte deux qualificatifs obligatoires, un par axe : `Importance`
(`IMPORTANT` / `NOT_IMPORTANT`) et `Urgency` (`URGENT` / `NOT_URGENT`), modélisés comme **deux
champs enum distincts et non nuls**.

C'est la décision structurante du modèle. Avec deux axes séparés, une combinaison
contradictoire — importante *et* non importante — est **impossible à représenter**. Aucune
validation applicative n'est nécessaire pour l'interdire : la structure des données s'en charge.
Une collection de badges aurait exigé un validateur personnalisé, donc une règle vivant dans le
code plutôt que dans le modèle, contournable par tout point d'entrée qui l'oublierait.

Le schéma généré le confirme : deux colonnes `not null`, et aucune colonne de quadrant.

### Quadrant dérivé, jamais persisté

Le croisement des deux axes donne quatre quadrants :

| importance | urgency | quadrant |
|---|---|---|
| `IMPORTANT` | `URGENT` | `DO_FIRST` |
| `IMPORTANT` | `NOT_URGENT` | `SCHEDULE` |
| `NOT_IMPORTANT` | `URGENT` | `DELEGATE` |
| `NOT_IMPORTANT` | `NOT_URGENT` | `DROP` |

Le quadrant est calculé dans le domaine (`Quadrant.of(importance, urgency)`), exposé en lecture,
et **jamais accepté en écriture** : `TaskRequest` ne comporte aucun champ `quadrant`, il n'existe
donc pas de chemin d'écriture à valider. Le persister créerait une donnée dénormalisée pouvant
diverger de ses deux sources.

Le filtre `?quadrant=` est traduit dans le service en couple (importance, urgency) ; il
n'atteint jamais la base tel quel.

### 404 et non 403 sur une ressource appartenant à autrui

Toute requête sur une tâche filtre par propriétaire au niveau du repository —
`findByIdAndUserId(id, currentUserId)`, jamais `findById(id)` suivi d'une vérification en Java :
la contrainte vit dans la requête, pas dans un contrôle qu'on peut oublier d'écrire.

Une tâche introuvable **ou appartenant à un autre utilisateur** renvoie **404**. Répondre 403
confirmerait l'existence de la ressource et permettrait d'énumérer les identifiants valides.
Pour la même raison, un échec de connexion renvoie `invalid credentials` sans indiquer si
l'adresse existe.

L'identité de l'utilisateur courant provient exclusivement du `SecurityContext`, jamais d'un
paramètre de requête ni d'un champ du corps.

### Filtrage et agrégation côté serveur

La pagination, les filtres et la recherche sont exécutés **en base**, via une `Specification`
composée dont le prédicat propriétaire est toujours appliqué. Filtrer en JavaScript sur un
tableau déjà chargé fonctionne sur trente tâches et s'effondre sur trois mille.

Les rapports agrègent de même en base, par `GROUP BY`. Charger toutes les tâches en mémoire pour
les compter dans une boucle Java est proscrit : le coût croîtrait linéairement avec
l'historique.

La distinction appliquée est celle-ci : **compter** en Java est interdit — le nombre de lignes
traversant JDBC croîtrait avec l'historique ; **compléter** une série en Java est requis — les
lignes sont des comptes déjà calculés, bornés par la longueur de la période demandée, et le
travail consiste à insérer des zéros là où la base n'avait aucune ligne. Les intervalles sans
donnée sont renvoyés à zéro, jamais omis : sinon chaque client réimplémenterait la même logique
de remplissage.

Le regroupement par quadrant se fait sur `(importance, urgency)` en SQL, puis le couple est mappé
vers `Quadrant` en Java. La base renvoie au plus quatre lignes portant déjà leur `count(*)` :
c'est du mapping, pas de l'agrégation. Un `CASE` SQL dupliquerait `Quadrant.of()` dans du texte
de requête, avec le risque de divergence.

### Gestion du fuseau horaire dans les rapports

Les rapports acceptent un paramètre `zone` optionnel (ex. `Africa/Douala`), UTC par défaut. Les
bornes de journée, de semaine, de mois et d'année sont calculées **dans ce fuseau** : sans cela,
un rapport quotidien est décalé pour tout utilisateur hors UTC.

`completedAt` est un `LocalDateTime`, donc sans offset. La convention est explicite : la colonne
contient toujours de l'heure **UTC**. `PeriodResolver` concentre la conversion en un seul
endroit — bornes calculées dans le fuseau utilisateur, puis `toInstant()`, puis
`LocalDateTime.ofInstant(instant, ZoneOffset.UTC)` pour la requête. Le retour compte autant :
les lignes reviennent en composantes UTC et sont reconverties dans le fuseau utilisateur *avant*
le regroupement en intervalles, sinon les bornes sont zonées et les intervalles UTC.

Pour que la convention tienne, la JVM tourne en UTC (`TimeZone.setDefault` au démarrage,
`-Duser.timezone=UTC` pour les tests, `TZ=UTC` dans les conteneurs). Les fonctions de date des
requêtes d'agrégation sont évaluées dans le fuseau de la session JDBC : si la JVM et cette
session divergent, **tous les agrégats sont décalés de l'offset**, et l'erreur est invisible car
cohérente avec elle-même.

Les intervalles sont produits en itérant des instants, jamais en comptant : un jour de
changement d'heure fait 23 ou 25 heures, et les longueurs de mois viennent de l'arithmétique
calendaire. Le début de semaine est fixé au lundi explicitement, et non déduit de la locale de
la requête.

`completedAt` sert de base aux rapports plutôt qu'`updatedAt`, qui change à chaque modification
et ne permettrait pas de savoir *quand* une tâche a réellement été achevée.

### Taux d'achèvement et variation

`GET /api/reports/summary` compte les tâches créées et les tâches terminées sur la période comme
**deux mesures indépendantes** : une tâche terminée aujourd'hui mais créée la semaine dernière
compte dans les tâches terminées. Le taux peut donc dépasser 100 % lors d'un rattrapage
d'arriéré. Le choix inverse — ne compter que les tâches créées *et* terminées dans la période —
bornerait le taux à 100 % mais ferait diverger la synthèse du graphique de tendance affiché
au-dessous, qui repose sur `completedAt` seul.

La période courante étant partielle et la précédente complète, la réponse porte
`currentPeriodComplete` : le backend rapporte le fait sans déformer la comparaison. La variation
du taux est exprimée en **points de pourcentage** (`completionRatePoints`) : « +25 % » est
ambigu entre 60→75 et 60→85, « +15 points » ne l'est pas. Une variation indéfinie (dénominateur
nul) est renvoyée à `null`, jamais à `0`, qui se lirait « stable ».

## Hors périmètre

Non implémenté et assumé comme tel : refresh token, rôles et permissions, partage de tâches
entre utilisateurs, notifications, pièces jointes, tâches récurrentes, corbeille, export des
rapports, internationalisation.
