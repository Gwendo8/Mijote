# API Mijote — contrat (validé le 2026-11-20)

Référence pour le back (qui code) et le front (qui appelle). Rien n'est codé : tout peut encore changer après le dialogue avec l'utilisatrice.
Les points marqués **[Q1]**, **[Q2]**… renvoient aux questions posées à l'utilisatrice.

---

## 1. Règles générales

### Format

- Tout est en JSON, adresse de base `/api`. Les champs du JSON sont en **camelCase** (`firstName`, `energyKcal`), comme les modèles Sequelize : pas de conversion à écrire.
- Dates sans heure : `"2026-11-16"`. Dates avec heure : ISO 8601 (`"2026-11-20T10:30:00.000Z"`).
- Les nombres décimaux sont renvoyés en **nombres** (pas en texte comme le fait Sequelize pour `DECIMAL`). Calories, protéines, glucides et lipides sont arrondis à 1 décimale.
- Réponse réussie : la donnée directement, sans enveloppe. Liste paginée : `{ "items": [...], "total": 120, "page": 1, "limit": 20 }` (`page` commence à 1, `limit` 20 par défaut, 50 au plus).
- Suppression : `204` sans corps. Création : `201` avec l'objet créé.

### Erreurs

```json
{
  "error": {
    "message": "Données invalides",
    "details": [
      { "path": ["email"], "message": "Adresse email invalide", "code": "invalid_format" }
    ]
  }
}
```

- `details` n'existe que pour les erreurs de validation (`400`) : c'est la liste des problèmes de Zod. `path` dit quel champ (ex. `["ingredients", 2, "grams"]`), `message` est le texte français à afficher sous ce champ.
- Codes : `400` données invalides · `401` pas connecté · `403` pas le droit · `404` introuvable · `409` conflit · `422` demande comprise mais impossible (ex. aucune recette trouvée sur la page importée) · `429` trop de requêtes · `502` service extérieur en panne (Open Food Facts, Brevo, site à importer).
- **Lecture d'une donnée qu'on n'a pas le droit de voir = `404`** (pas `403`), pour ne pas révéler qu'elle existe (ex. la recette privée d'une autre personne). `403` est réservé à « je vois la chose mais je n'ai pas le droit de la modifier » et aux routes admin.

### Authentification (session par cookie) **[Q1]**

- Connexion : l'API pose un cookie `mijote_session` (valeur aléatoire de 32 octets ; seule son empreinte est gardée en base, table `sessions`, **une ligne par appareil**). Le cookie est `HttpOnly` (le JavaScript de la page ne peut pas le lire), `SameSite=Lax`, `Secure` en production. Comportement aligné sur Platine : valable **6 mois**, prolongé à chaque visite (renouvelé au plus une fois par jour).
- « Se déconnecter » ne ferme que l'appareil en cours ; « Me déconnecter partout » ferme toutes les sessions du compte.
- Le front n'a **rien à stocker** : il appelle `GET /api/auth/me` au chargement ; `200` = connecté, `401` = pas connecté. Il faut appeler l'API avec `credentials: 'include'` (ou, mieux, que front et API soient sur la même adresse : proxy Vite en développement, Caddy en production).
- Toute route est protégée (`401` sans session valide) sauf celles marquées **Public**.
- Droits : `user` (par défaut) ou `admin` (`/api/admin/*`). Chaque route qui touche une donnée vérifie le propriétaire, pas seulement la connexion.

### Limites de requêtes

- Général : 2000 requêtes / 15 minutes / adresse (large : les listes avec photos font beaucoup de requêtes).
- Plus strict (10 échecs / 15 min, les réussites ne comptent pas) : connexion, inscription, réinitialisation, lecture d'un lien d'invitation, et les routes `/api/me` qui demandent le mot de passe. Mot de passe oublié : 5 demandes / 15 min (un e-mail part à chaque fois). Open Food Facts : 20 / minute (l'API d'Open Food Facts limite aussi).
- Le serveur sera derrière Caddy et Tailscale Funnel : il faut régler `trust proxy` pour que la limite compte les vraies adresses.

---

## 2. Comptes

Objet **utilisateur** (jamais de `passwordHash`) :
`{ "id": 3, "email": "a@b.fr", "firstName": "Gwen", "lastName": "Martin", "role": "user", "createdAt": "…" }`

### Public

| Route                                 | Reçoit                                             | Renvoie                                                                                                                                                 | Erreurs                                                                                                                                                         |
| ------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /api/settings/public`            | —                                                  | `{ "registrationOpen": false }` (pour afficher ou non « Créer un compte »)                                                                              | —                                                                                                                                                               |
| `GET /api/auth/invitations/:token`    | jeton du lien                                      | `{ "email": "a@b.fr", "expiresAt": "…" }` (pour préremplir et verrouiller l'e-mail, et afficher la date de validité du lien)                            | `404` « Invitation invalide ou expirée » (inconnue, expirée ou déjà utilisée)                                                                                   |
| `POST /api/auth/register`             | `{ token?, email, password, firstName, lastName }` | `201` utilisateur + cookie de session (connecté tout de suite)                                                                                          | `400` validation · `403` « Les inscriptions sont fermées » (pas de `token` et réglage fermé) · `404` jeton invalide · `409` « Cette adresse est déjà utilisée » |
| `POST /api/auth/login`                | `{ email, password }`                              | `200` utilisateur + cookie                                                                                                                              | `400` · `401` « Adresse e-mail ou mot de passe incorrect » (même message dans les deux cas) · `429`                                                             |
| `POST /api/auth/forgot-password`      | `{ email }`                                        | `204` **toujours**, même si l'adresse n'existe pas (on ne révèle pas qui a un compte) ; si elle existe, un e-mail avec un lien valable 1 heure part     | `400` · `429`                                                                                                                                                   |
| `GET /api/auth/reset-password/:token` | jeton du lien                                      | `{ "email": "a@b.fr", "expiresAt": "…" }` (pour afficher à qui sert le lien et jusqu'à quand ; même limite de requêtes que les autres routes publiques) | `400` « Lien invalide ou expiré » (même message : inconnu, expiré ou déjà utilisé) · `429`                                                                      |
| `POST /api/auth/reset-password`       | `{ token, password }`                              | `204` ; **pas de connexion automatique** ; toutes les sessions de la personne sont fermées (elle doit se reconnecter)                                   | `400` « Lien invalide ou expiré »                                                                                                                               |

Avec un `token` d'invitation, l'e-mail est celui de l'invitation (le champ `email` reçu est ignoré). À l'inscription, le serveur crée les 4 créneaux par défaut (Petit-déj, Midi, Collation, Soir) et marque l'invitation comme utilisée.
Règles de mot de passe (les mêmes que Platine) : 8 caractères au moins, au moins un chiffre, au moins un caractère spécial, 128 caractères au plus (un message clair par règle). Adresse e-mail enregistrée en minuscules.

### Connecté

| Route                       | Reçoit                                                                                                           | Renvoie                                                                                                                                                         | Erreurs                                                                                                                       |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `GET /api/auth/me`          | —                                                                                                                | utilisateur                                                                                                                                                     | `401`                                                                                                                         |
| `POST /api/auth/logout`     | —                                                                                                                | `204`, seule la session de l'appareil en cours est supprimée                                                                                                    | —                                                                                                                             |
| `POST /api/auth/logout-all` | —                                                                                                                | `204`, **toutes** les sessions du compte sont supprimées (« Me déconnecter partout »)                                                                           | —                                                                                                                             |
| `PATCH /api/me`             | `{ firstName?, lastName?, email?, currentPassword }` (`currentPassword` obligatoire seulement si `email` change) | utilisateur à jour                                                                                                                                              | `400` · `401` mauvais mot de passe · `409` adresse déjà utilisée                                                              |
| `PUT /api/me/password`      | `{ currentPassword, newPassword }`                                                                               | `204` ; les sessions des **autres** appareils sont fermées, l'appareil en cours reste connecté                                                                  | `400` · `401` mauvais mot de passe actuel                                                                                     |
| `DELETE /api/me`            | `{ password }`                                                                                                   | `204`, toutes les sessions fermées, tout ce que la personne possède est supprimé (recettes, aliments perso, planning…) ; les copies faites par d'autres restent | `401` mauvais mot de passe · `409` « Tu es la seule administratrice : nomme quelqu'un d'autre avant de supprimer ton compte » |
| `GET /api/users/search?q=`  | `q` : 2 caractères au moins                                                                                      | `[ { "id": 5, "firstName": "Camille", "lastName": "Durand" } ]`, 10 au plus, sans e-mail, sans soi-même. Sert à choisir les personnes d'un partage **[Q5]**     | `400`                                                                                                                         |

Liens des e-mails vers le front : invitation `APP_URL/inscription?token=…`, mot de passe oublié ou lien créé par l'admin `APP_URL/mot-de-passe?token=…`.

Changement d'e-mail : pas d'e-mail de confirmation en V1 (le mot de passe actuel suffit).

---

## 3. Admin (`role = admin`, sinon `403`)

### Comptes et invitations

| Route                                  | Reçoit                        | Renvoie                                                                                                                                                                                                  | Erreurs                                                                                                           |
| -------------------------------------- | ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `GET /api/admin/users?q=&page=&limit=` | recherche sur nom ou e-mail   | liste paginée d'utilisateurs, avec `recipeCount`                                                                                                                                                         | —                                                                                                                 |
| `PATCH /api/admin/users/:id`           | `{ role: 'user' \| 'admin' }` | utilisateur                                                                                                                                                                                              | `404` · `409` « Il doit rester au moins un admin » **[Q4]**                                                       |
| `DELETE /api/admin/users/:id`          | —                             | `204` (tout ce qu'il possède part avec lui)                                                                                                                                                              | `404` · `409` si c'est le dernier admin ; pour se supprimer soi-même, utiliser `DELETE /api/me`                   |
| `POST /api/admin/users/:id/reset-link` | —                             | `204` : un e-mail avec un lien de réinitialisation (valable 24 h) part **à la personne** ; l'admin ne voit jamais le lien ni le mot de passe                                                             | `404` · `502` e-mail non envoyé                                                                                   |
| `GET /api/admin/invitations`           | —                             | `[ { id, email, expiresAt, createdAt, invitedBy: { id, firstName, lastName } } ]` (en attente seulement)                                                                                                 | —                                                                                                                 |
| `POST /api/admin/invitations`          | `{ email }`                   | `201` invitation ; e-mail envoyé avec un lien `APP_URL/inscription?token=…` valable 7 jours. Si une invitation en attente existe déjà pour cette adresse, elle est renouvelée et renvoyée (même réponse) | `400` · `409` « Cette personne a déjà un compte » · `502` e-mail non envoyé (l'invitation n'est alors pas gardée) |
| `DELETE /api/admin/invitations/:id`    | —                             | `204` (annule l'invitation)                                                                                                                                                                              | `404`                                                                                                             |

L'**inviter** est réservé à l'admin **[Q3]**.

### Réglages, étiquettes, corrections d'aliments

| Route                                    | Reçoit                                                                                                                  | Renvoie                                    | Erreurs                                                                                       |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ | --------------------------------------------------------------------------------------------- |
| `GET /api/admin/settings`                | —                                                                                                                       | `{ "registrationOpen": false }`            | —                                                                                             |
| `PATCH /api/admin/settings`              | `{ registrationOpen }`                                                                                                  | idem                                       | `400`                                                                                         |
| `POST /api/admin/tags`                   | `{ name }` (1 à 50 caractères)                                                                                          | `201` `{ id, name, position }`             | `400` · `409` « Cette étiquette existe déjà »                                                 |
| `PATCH /api/admin/tags/:id`              | `{ name?, position? }`                                                                                                  | étiquette                                  | `404` · `409`                                                                                 |
| `DELETE /api/admin/tags/:id`             | —                                                                                                                       | `204` (retirée aussi des recettes)         | `404`                                                                                         |
| `GET /api/admin/foods/corrections?page=` | —                                                                                                                       | aliments corrigés (objet aliment, voir §4) | —                                                                                             |
| `PUT /api/admin/foods/:id/correction`    | `{ name?, energyKcal?, proteinsG?, carbsG?, fatsG?, note? }` (champ absent ou `null` = pas corrigé ; au moins un champ) | aliment avec sa correction                 | `400` · `404` · `400` « Seuls les aliments communs peuvent être corrigés » si `source = user` |
| `DELETE /api/admin/foods/:id/correction` | —                                                                                                                       | `204` (retour à la valeur d'origine)       | `404`                                                                                         |

`GET /api/tags` (liste des étiquettes, triée par `position`) est ouverte à tout compte connecté : `[ { id, name, position } ]`.
Il n'y a pas de seeders d'étiquettes : l'admin les crée dans son écran.

---

## 4. Aliments

Objet **aliment** (valeurs pour 100 g, valeurs **effectives** : la correction admin si elle existe) :

```json
{
  "id": 812,
  "source": "ciqual",
  "name": "Poulet, blanc, cuit",
  "brand": null,
  "category": "viandes cuites",
  "barcode": null,
  "energyKcal": 151,
  "proteinsG": 29.8,
  "carbsG": 0,
  "fatsG": 3.5,
  "isCorrected": true,
  "original": { "name": "…", "energyKcal": 158, "proteinsG": 30, "carbsG": 0, "fatsG": 3.9 },
  "correctionNote": "Valeur vérifiée sur l'emballage",
  "isMine": false
}
```

`original` et `correctionNote` ne sont renseignés que si `isCorrected`. `energyKcal` etc. peuvent être `null` (surtout pour Open Food Facts) : l'aliment compte alors comme « à compléter » dans une recette.

| Route                          | Qui          | Reçoit                                                                                                                                 | Renvoie                                                                                                                                                                                                                                                                                                                                                                                                      | Erreurs                                                                                                 |
| ------------------------------ | ------------ | -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| `GET /api/foods`               | connecté     | `q` (2 car. min., obligatoire), `source?` (`ciqual`, `off`, `user`), `page`, `limit`                                                   | liste paginée. Cherche dans Ciqual (hors aliments archivés), mes aliments perso et les produits Open Food Facts déjà en cache ; insensible aux accents et aux majuscules, tous les mots doivent s'y trouver ; ordre : nom qui commence par la recherche, puis nom plus court ; Ciqual avant Open Food Facts                                                                                                  | `400`                                                                                                   |
| `GET /api/foods/mine?page=`    | connecté     | —                                                                                                                                      | mes aliments perso (archivés exclus), du plus récent au plus ancien                                                                                                                                                                                                                                                                                                                                          | —                                                                                                       |
| `GET /api/foods/:id`           | connecté     | —                                                                                                                                      | aliment (archivé compris : il reste lisible)                                                                                                                                                                                                                                                                                                                                                                 | `404` si c'est un aliment perso d'une autre personne **et** que je ne vois aucune recette qui l'utilise |
| `GET /api/foods/barcode/:code` | connecté     | `code` : 8 à 14 chiffres                                                                                                               | aliment : cherché d'abord parmi **mes aliments perso non archivés** portant ce code (renvoyé tel quel, Open Food Facts n'est pas appelé ; les aliments perso des autres comptes ne sont jamais trouvés), puis en base (cache), sinon demandé à Open Food Facts puis gardé en base ; un produit en cache de plus de 90 jours est rafraîchi (si Open Food Facts ne répond pas, on renvoie la version en cache) | `400` · `404` « Produit introuvable : ajoute-le à la main » · `502`                                     |
| `GET /api/foods/off/search?q=` | connecté     | `q` 2 car. min.                                                                                                                        | `{ items: [aliments], total }` (20 au plus) : recherche chez Open Food Facts, chaque résultat est gardé en base                                                                                                                                                                                                                                                                                              | `400` · `429` · `502` « Open Food Facts ne répond pas, réessaie plus tard »                             |
| `POST /api/foods`              | connecté     | `{ name, brand?, category?, barcode?, energyKcal, proteinsG, carbsG, fatsG }` (calories obligatoires, le reste optionnel, valeurs ≥ 0) | `201` aliment perso (`source: user`, à moi)                                                                                                                                                                                                                                                                                                                                                                  | `400`                                                                                                   |
| `PATCH /api/foods/:id`         | propriétaire | mêmes champs, tous optionnels (`barcode` : 8 à 14 chiffres, `null` ou `""` pour l'effacer)                                             | aliment                                                                                                                                                                                                                                                                                                                                                                                                      | `403` (aliment commun ou d'une autre personne) · `404`                                                  |
| `DELETE /api/foods/:id`        | propriétaire | —                                                                                                                                      | `200` `{ "result": "deleted" \| "archived" }` : un aliment **jamais utilisé** est supprimé pour de vrai ; un aliment **utilisé dans des recettes** est archivé (`archivedAt`) : il disparaît de ma liste et des recherches, mais les recettes qui l'utilisent gardent leurs calories et restent lisibles par ceux qui les voient                                                                             | `403` · `404`                                                                                           |

Open Food Facts : l'énergie vient de `energy-kcal_100g` (ou du `energy_100g` en kJ divisé par 4,184). Le serveur envoie un `User-Agent` d'application (réglable dans `.env`, `OFF_USER_AGENT`), comme le demande Open Food Facts.
Les corrections s'appliquent aux aliments communs, Ciqual **et** Open Food Facts **[Q6]**.

Code-barres d'un aliment perso : `barcode` (8 à 14 chiffres, message `Le code-barres doit contenir 8 à 14 chiffres`) est facultatif à la création et à la modification, `null` ou `""` l'efface. Il est unique par personne parmi ses aliments non archivés : un doublon donne `409` « Tu as déjà un aliment avec ce code-barres » (sur `POST` et `PATCH`). Deux comptes, ou un aliment perso et un produit Open Food Facts en cache, peuvent porter le même code. Au scan, mon aliment perso passe avant le cache et Open Food Facts.

### Chargement de la table Ciqual (script, pas une route)

- Données : la table officielle de l'ANSES, gratuite. Version actuelle (2025) : https://entrepot.recherche.data.gouv.fr/dataset.xhtml?persistentId=doi:10.57745/RDMHWY (page de l'ANSES : https://ciqual.anses.fr/#/cms/download/node/20). **Ce ne sont pas un mais plusieurs fichiers XML** : à télécharger dans un même dossier `alim_AAAA_MM_JJ.xml` (les aliments), `alim_grp_AAAA_MM_JJ.xml` (les groupes) et `compo_AAAA_MM_JJ.xml` (les teneurs, environ 70 Mo). Les autres fichiers (`const`, `sources`) ne servent pas. Si l'ANSES fournit un `.zip`, le décompresser d'abord.
- Commande (à lancer par l'utilisatrice sur chaque base) : `cd server && npm run ciqual:import -- chemin/du/dossier`. Sur la base de test, le back la lance lui-même.
- Le script ajoute les aliments nouveaux et met à jour les existants (clé : `ciqual_code`). Un aliment qui n'est plus dans les fichiers est **archivé** (`archivedAt`, jamais supprimé : les recettes qui l'utilisent continuent de marcher), et il revient s'il réapparaît. Les corrections admin ne sont jamais touchées. Tout se fait d'un bloc (en cas d'erreur, rien n'est modifié). Il affiche le bilan (ajoutés, mis à jour, réactivés, inchangés, archivés) et peut être relancé sans danger.
- Il garde l'énergie en kcal (règlement UE 1169/2011, sinon facteur de Jones), les protéines (N x 6,25, sinon Jones), glucides, lipides, le nom et la catégorie (le sous-groupe, ex. « viandes cuites », sinon le groupe). Règle des valeurs écrites en texte : « traces » devient `0`, « < x » devient `x`, « - » ou vide devient `null` (inconnu).
- Les fichiers (plusieurs Mo) ne sont pas versionnés : à garder hors du dépôt.

### Précisions apportées au codage (bloc 2)

- **Prénom et nom séparés** (comme Platine, 2026-11-20) : `displayName` n'existe plus. L'utilisateur a `firstName` et `lastName` (100 caractères, obligatoires : « Le prénom est obligatoire », « Le nom est obligatoire »). Les autres personnes (`owner`, `sharedWith`, `invitedBy`, `user`, recherche) sont `{ id, firstName, lastName }`. Les comptes d'avant la séparation ont leur ancien nom en `firstName` et un `lastName` **vide** (à compléter dans le profil). `GET /api/users/search` cherche dans le prénom et le nom, sans accents, chaque mot tapé devant se trouver dans l'un des deux (« camille du pre » marche). Résultats triés par nom puis prénom.

- Liste des comptes admin : chaque élément a `id, email, firstName, lastName, role, createdAt, recipeCount` (`recipeCount` = recettes, sans les idées de plats). Tri par nom, puis prénom.
- `DELETE /api/admin/users/:id` sur soi-même : `400` « Pour supprimer ton propre compte, utilise ton profil ». Retirer le rôle admin au dernier admin : `409`.
- Étiquettes : `position` dans `PATCH /api/admin/tags/:id` est la **place voulue dans la liste** (0 = en premier) ; les autres se décalent et toute la liste est renumérotée 0, 1, 2… `POST` met la nouvelle étiquette à la fin. Les doublons sont refusés sans tenir compte des majuscules.
- Invitation renouvelée : même `id` et même `createdAt`, nouveau lien, nouvelle échéance.
- Aliment : `archivedAt` est aussi renvoyé (`null` sauf pour un aliment archivé lu par son identifiant).
- Recherche d'aliments (`GET /api/foods`) : le nom d'origine, le nom corrigé et la marque sont cherchés ; ordre : nom qui commence par la recherche, puis Ciqual avant mes aliments avant Open Food Facts, puis nom plus court.
- `GET /api/foods/off/search` : `total` = nombre de produits renvoyés (20 au plus). La limite de 20 requêtes par minute compte aussi les lectures de code-barres déjà en cache.
- Valeurs maximales d'un aliment perso (pour 100 g) : 1000 kcal ; 100 g pour les protéines, glucides et lipides.
- `PATCH /api/foods/:id` sur un aliment perso d'une autre personne : `404` si on ne le voit dans aucune recette, `403` sinon. Sur un aliment archivé : `404`.
- `PUT /api/admin/foods/:id/correction` remplace la correction précédente en entier ; il faut au moins une valeur parmi `name`, `energyKcal`, `proteinsG`, `carbsG`, `fatsG` (une `note` seule ne suffit pas).

---

## 5. Recettes et idées de plats

Une seule famille de routes `/api/recipes`, avec `kind` : `recipe` (recette, avec étapes) ou `idea` (idée de plat, sans étapes). Les écrans sont distincts, l'API est commune.

### Objet recette (détail)

```json
{
  "id": 12,
  "kind": "recipe",
  "title": "Poulet au citron",
  "description": "…",
  "instructions": "Couper le poulet.\nFaire dorer.",
  "servings": 4,
  "prepTimeMinutes": 15,
  "cookTimeMinutes": 30,
  "sourceUrl": "https://…",
  "photoUrl": "/api/recipes/12/photo?v=1763640000",
  "visibility": "shared",
  "owner": { "id": 3, "firstName": "Gwen", "lastName": "Martin" },
  "isMine": true,
  "sharedWith": [{ "id": 5, "firstName": "Camille", "lastName": "Durand" }],
  "copiedFrom": { "id": 7, "title": "Poulet rôti" },
  "tags": [{ "id": 2, "name": "Plat" }],
  "ingredients": [
    {
      "id": 40,
      "position": 0,
      "label": "500 g de blanc de poulet",
      "grams": 500,
      "isNegligible": false,
      "food": { "id": 812, "…": "objet aliment" }
    },
    {
      "id": 41,
      "position": 1,
      "label": "1 pincée de sel",
      "grams": null,
      "isNegligible": true,
      "food": null
    },
    {
      "id": 42,
      "position": 2,
      "label": "2 citrons",
      "grams": null,
      "isNegligible": false,
      "food": null
    }
  ],
  "nutrition": {
    "caloriesPerServing": null,
    "proteinsPerServing": null,
    "caloriesSource": null,
    "proteinsSource": null,
    "isComplete": false,
    "missingIngredients": 1,
    "total": { "calories": 755, "proteins": 149, "carbs": 0, "fats": 17.5 },
    "perServing": { "calories": 188.8, "proteins": 37.3, "carbs": 0, "fats": 4.4 }
  },
  "createdAt": "…",
  "updatedAt": "…"
}
```

- `sharedWith` n'est renvoyé qu'à l'autrice ; `copiedFrom` vaut `null` si la recette d'origine a disparu ou n'est plus visible pour la personne.
- **Calcul des calories** (refait à chaque lecture, jamais stocké) : chaque ingrédient avec un aliment et des grammes compte `grams / 100 × valeur de l'aliment` ; un ingrédient « négligeable » compte 0 ; tout autre ingrédient (sans aliment, sans grammes, ou aliment sans calories) est « à compléter ». `isComplete` = plus aucun ingrédient à compléter ; `missingIngredients` en donne le nombre.
- `total` et `perServing` sont calculés avec ce qui est connu (peut être partiel quand `isComplete` est faux : le front affiche « à compléter »). `perServing` = `total` / `servings`.
- `caloriesPerServing` / `proteinsPerServing` = **la valeur à afficher** : la correction à la main si elle existe (`caloriesSource: "manual"`), sinon le calcul si `isComplete` (`"computed"`), sinon `null` (« à compléter »). Les protéines sont indépendantes des calories.
- Dans les listes, le même objet `nutrition` est renvoyé, mais sans `total`, `perServing` ni `ingredients`.

### Corps de création et de modification

```json
{
  "kind": "recipe",
  "title": "…",
  "description": "…",
  "instructions": "une étape par ligne",
  "servings": 4,
  "prepTimeMinutes": 15,
  "cookTimeMinutes": 30,
  "sourceUrl": "https://…",
  "photoUrl": "https://site/image.jpg",
  "visibility": "shared",
  "sharedWith": [5, 8],
  "tagIds": [2, 4],
  "caloriesPerServingManual": null,
  "proteinsPerServingManual": null,
  "ingredients": [
    { "label": "500 g de blanc de poulet", "foodId": 812, "grams": 500, "isNegligible": false }
  ]
}
```

- Obligatoire : `kind` (création seulement, non modifiable), `title` (1 à 255), `servings` (entier 1 à 100, défaut 1), `ingredients`. Une **idée** exige au moins un ingrédient avec aliment et grammes, et ignore `instructions`, `prepTimeMinutes`, `cookTimeMinutes`.
- `photoUrl` (création uniquement, utilisé par l'import) : le serveur télécharge l'image, la réduit et la garde. Si le téléchargement échoue, la recette est quand même créée, sans photo.
- `ingredients` : la liste **remplace** celle qui existe (l'ordre du tableau donne `position`). `label` est obligatoire sauf si `foodId` est donné (il vaut alors le nom de l'aliment). `foodId` doit être un aliment que la personne peut voir (commun, ou à elle). `grams` > 0.
- `visibility` : `private`, `shared` (avec `sharedWith`, 1 personne au moins) ou `public` (tous les comptes connectés la voient et peuvent la copier ; pas de lien public pour les visiteurs sans compte).
- `tagIds` : étiquettes existantes (`400` sinon).

### Routes

| Route                           | Qui                                                              | Reçoit                                                                         | Renvoie                                                                                                                                                                                                                                                                                                                                     | Erreurs                                                                                                                                                      |
| ------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `GET /api/recipes`              | connecté                                                         | filtres ci-dessous                                                             | liste paginée de recettes (version courte)                                                                                                                                                                                                                                                                                                  | `400`                                                                                                                                                        |
| `GET /api/recipes/:id`          | autrice, personne choisie, ou tout le monde si `public`          | —                                                                              | recette (détail)                                                                                                                                                                                                                                                                                                                            | `404`                                                                                                                                                        |
| `POST /api/recipes`             | connecté                                                         | corps ci-dessus                                                                | `201` recette (détail)                                                                                                                                                                                                                                                                                                                      | `400`                                                                                                                                                        |
| `PUT /api/recipes/:id`          | autrice                                                          | corps ci-dessus (tout le contenu ; sans `kind` ni `photoUrl`)                  | recette (détail)                                                                                                                                                                                                                                                                                                                            | `400` · `403` · `404`                                                                                                                                        |
| `DELETE /api/recipes/:id`       | autrice                                                          | —                                                                              | `204` ; les cases du planning qui l'utilisaient gardent leur titre en texte libre ; la photo est effacée                                                                                                                                                                                                                                    | `403` · `404`                                                                                                                                                |
| `POST /api/recipes/:id/copy`    | quiconque peut la voir (aussi sa propre recette : « dupliquer ») | —                                                                              | `201` nouvelle recette **privée** à moi, avec `copiedFrom`, ses étiquettes ; les aliments perso de l'autrice utilisés sont copiés chez moi et reliés ; la photo est copiée                                                                                                                                                                  | `404`                                                                                                                                                        |
| `POST /api/recipes/import`      | connecté                                                         | `{ url }`                                                                      | `200` **brouillon, rien n'est enregistré** : `{ title, description, instructions, servings, prepTimeMinutes, cookTimeMinutes, sourceUrl, imageUrl, ingredients: [ { label } ] }`. Le front remplit le formulaire, la personne complète (aliments, grammes) puis enregistre avec `POST /api/recipes` (en passant `imageUrl` dans `photoUrl`) | `400` adresse invalide · `422` « Aucune recette trouvée sur cette page : ajoute-la à la main (le lien sera gardé) » (cas de TikTok) · `502` page injoignable |
| `PUT /api/recipes/:id/photo`    | autrice                                                          | formulaire `multipart`, champ `photo` (JPEG, PNG, WebP ou HEIC, 10 Mo au plus) | `{ photoUrl }`                                                                                                                                                                                                                                                                                                                              | `400` « Image invalide ou trop lourde » · `403` · `404`                                                                                                      |
| `DELETE /api/recipes/:id/photo` | autrice                                                          | —                                                                              | `204`                                                                                                                                                                                                                                                                                                                                       | `403` · `404`                                                                                                                                                |
| `GET /api/recipes/:id/photo`    | comme la lecture de la recette                                   | —                                                                              | l'image (WebP, `Cache-Control: private`) ; le cookie suffit, donc une balise `<img src>` marche                                                                                                                                                                                                                                             | `404`                                                                                                                                                        |

**Filtres de `GET /api/recipes`** (tous optionnels) :

| Paramètre                    | Sens                                                                                                                                      |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `scope`                      | `mine` (les miennes), `shared` (partagées avec moi), `public` (visibles par tous, sauf les miennes), `all` (tout ce que je vois ; défaut) |
| `kind`                       | `recipe` ou `idea`                                                                                                                        |
| `q`                          | cherche dans le titre et dans le texte des ingrédients, sans accents ni majuscules (`unaccent(lower(…))` des deux côtés, comme Platine)   |
| `tagIds`                     | étiquettes, séparées par des virgules (`2,4`) : la recette doit avoir **toutes** celles-ci                                                |
| `maxCalories`, `minProteins` | par part (valeur affichée) ; les recettes « à compléter » sont exclues quand un de ces filtres est actif                                  |
| `ownerId`                    | une personne précise                                                                                                                      |
| `sort`                       | `recent` (défaut), `title`, `calories`, `proteins` ; `order` : `asc` ou `desc`                                                            |
| `page`, `limit`              | pagination                                                                                                                                |

Import par lien — détails : le serveur télécharge la page (10 s au plus, 2 Mo au plus, 3 redirections au plus, uniquement `http`/`https`, **adresses internes refusées** : un site ne doit pas pouvoir faire lire le réseau de la maison), lit les blocs `application/ld+json`, repère la fiche `Recipe` (même dans un `@graph`) et convertit : durées ISO (`PT1H30M` → 90 min), nombre de parts (premier nombre de `recipeYield`, sinon 1), étapes (texte ou liste d'étapes → une par ligne), ingrédients (une ligne chacun, **sans** aliment ni grammes : la personne les relie). Pas d'IA.

Cas particulier : si les aliments d'une recette partagée sont des aliments perso de l'autrice, ils restent lisibles dans le détail de la recette (objet `food` inclus) même si la personne ne les voit pas ailleurs.

### Précisions apportées au codage (bloc 3)

- Le **détail** d'une recette renvoie en plus `caloriesPerServingManual` et `proteinsPerServingManual` (la correction à la main telle qu'enregistrée, `null` sinon) pour préremplir le formulaire de modification. `sharedWith` n'est présent que pour l'autrice.
- `nutrition` contient un champ de plus, `proteinsComplete` : `isComplete` et `missingIngredients` parlent des **calories** (un ingrédient sans aliment ni grammes compte dans les deux), `proteinsComplete` dit si les protéines sont toutes connues (un aliment peut avoir des calories sans protéines).
- Les **listes** renvoient : `id, kind, title, description, servings, prepTimeMinutes, cookTimeMinutes, photoUrl, visibility, owner, isMine, tags, nutrition` (sans `total` ni `perServing`), `createdAt, updatedAt`.
- Tri par défaut : `recent` et `proteins` en décroissant, `title` et `calories` en croissant (`order` pour changer). Les recettes « à compléter » passent toujours en dernier. `scope=shared` = recettes en mode « partagée » dont je suis un des destinataires (les publiques sont dans `scope=public`).
- `POST /api/recipes/import` : `sourceUrl` du brouillon = l'adresse envoyée ; adresse invalide ou interne, y compris après une redirection : `400` ; page injoignable, en erreur ou de plus de 2 Mo : `502` ; page qui n'est pas du HTML : `422`. Limite : 20 imports par minute.
- `PUT /api/recipes/:id/photo` : un fichier qui n'est pas une image lisible (ou plus de 10 Mo) donne `400` « Image invalide ou trop lourde ». **HEIC** : l'outil de réduction n'en lit pas toujours ; le front doit envoyer du JPEG, PNG ou WebP (`accept="image/jpeg,image/png,image/webp"` fait convertir les photos d'iPhone par Safari). `photoUrl` change (`?v=`) à chaque modification de la recette.
- Photos : la lecture (`GET /api/recipes/:id/photo`) a son propre compteur de requêtes (3000 / 15 min), à part de la limite générale.
- `DELETE /api/recipes/:id/photo` répond `204` même s'il n'y avait pas de photo.
- Un aliment **archivé** ne peut plus être ajouté à une recette (`400`), mais reste valable dans les recettes qui l'utilisent déjà. Une copie d'une recette copie aussi les aliments perso de l'autrice qu'elle utilise (un exemplaire par copie).
- Idée de plat : `400` « Une idée de plat doit contenir au moins un aliment avec ses grammes » (`details[0].path = ["ingredients"]`). Partage sans personne, avec soi-même ou avec un compte inconnu : `400` sur `sharedWith`. Étiquette inconnue : `400` sur `tagIds`.
- Supprimer un compte (par la personne ou par l'admin) efface aussi les photos de ses recettes sur le disque.

---

## 6. Planning

Un planning par personne, en **semaines datées** (du lundi au dimanche). Un créneau d'un jour peut contenir plusieurs plats.

Objet **entrée** :

```json
{
  "id": 90,
  "date": "2026-11-17",
  "slotId": 4,
  "position": 0,
  "label": "Poulet au citron",
  "servings": 1.5,
  "caloriesManual": null,
  "recipe": {
    "id": 12,
    "kind": "recipe",
    "title": "Poulet au citron",
    "photoUrl": "…",
    "isMine": false
  },
  "recipeAvailable": true,
  "lastKnownKcalPerServing": 188.8,
  "lastKnownProteinsPerServing": 37.3,
  "calories": 283.2,
  "proteins": 56
}
```

- Chaque entrée liée à une recette retient les **dernières calories et protéines par part connues** (`lastKnownKcalPerServing`, `lastKnownProteinsPerServing`). Elles sont mises à jour à l'ajout et à chaque lecture où la recette est encore visible et calculable.
- `recipeAvailable` : `true` si la recette est encore visible et existe ; `false` si elle a été supprimée ou n'est plus visible (partage retiré). Dans ce cas `recipe` vaut `null`, le titre reste dans `label`, et `calories` / `proteins` = dernières valeurs retenues × `servings` : elles **comptent dans le total du jour**. La recette ne s'ouvre plus et ne peut plus être ajoutée à de nouvelles cases (`404`).
- Texte libre (`recipeId` vide dès l'origine) : `recipeAvailable` vaut `null` ; `calories` = `caloriesManual` (sinon `null`). Recette visible mais « à compléter » : `calories` vaut `null`, sauf si une valeur antérieure est retenue.
- `calories` / `proteins` d'une entrée = valeur par part × `servings` (1 si absent).
- Proposition de copie : quand le front place une recette qui n'est pas à la personne (`recipe.isMine` est `false` dans les listes et le détail, voir §5), il peut proposer « Copier chez moi pour la garder ? » ; l'appel est `POST /api/recipes/:id/copy`. Rien n'est copié sans accord.
- Objet **créneau** : `{ id, name, position, isDefault, isHidden }`.

| Route                                       | Qui                                                            | Reçoit                                                                                                                                                                                                                                                 | Renvoie                                                                                                                                                                                                                                                                                                                                                                                         | Erreurs                                                                                   |
| ------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `GET /api/planning?week=2026-11-16&userId=` | moi, ou la personne `userId` si elle m'a partagé cette semaine | `week` : une date quelconque, la semaine qui la contient est renvoyée (défaut : cette semaine) ; `userId` absent = mon planning                                                                                                                        | `{ weekStart, weekEnd, owner: { id, firstName, lastName }, isMine, slots: [créneaux], days: [ { date, entries: [entrées], totalCalories, totalProteins } × 7 ], totals: { calories, proteins } }`. Les créneaux masqués ne sont pas listés, sauf s'ils contiennent des entrées cette semaine. Les totaux ignorent les entrées dont les calories sont inconnues (`unknownCount` indique combien) | `400` date invalide · `404` planning non partagé avec moi                                 |
| `POST /api/planning/entries`                | moi                                                            | `{ date, slotId, recipeId?, label?, servings?, caloriesManual? }` : `recipeId` (recette **visible** pour moi) **ou** `label` (texte libre) ; `label` vaut par défaut le titre de la recette ; les dernières valeurs par part sont retenues dès l'ajout | `201` entrée                                                                                                                                                                                                                                                                                                                                                                                    | `400` · `404` recette (introuvable ou plus visible) ou créneau introuvable (ou pas à moi) |
| `PATCH /api/planning/entries/:id`           | propriétaire                                                   | `{ date?, slotId?, position?, label?, servings?, caloriesManual? }` : sert aussi à **déplacer** (changer `date` / `slotId` / `position` ; les positions du créneau sont renumérotées)                                                                  | entrée                                                                                                                                                                                                                                                                                                                                                                                          | `400` · `404`                                                                             |
| `DELETE /api/planning/entries/:id`          | propriétaire                                                   | —                                                                                                                                                                                                                                                      | `204`                                                                                                                                                                                                                                                                                                                                                                                           | `404`                                                                                     |
| `GET /api/planning/slots`                   | moi                                                            | —                                                                                                                                                                                                                                                      | tous mes créneaux, masqués compris, par `position`                                                                                                                                                                                                                                                                                                                                              | —                                                                                         |
| `POST /api/planning/slots`                  | moi                                                            | `{ name }` (1 à 50)                                                                                                                                                                                                                                    | `201` créneau (`isDefault: false`, en dernier)                                                                                                                                                                                                                                                                                                                                                  | `400` · `409` « Ce créneau existe déjà »                                                  |
| `PATCH /api/planning/slots/:id`             | propriétaire                                                   | `{ name?, isHidden?, position? }`                                                                                                                                                                                                                      | créneau                                                                                                                                                                                                                                                                                                                                                                                         | `400` · `404` · `409`                                                                     |
| `DELETE /api/planning/slots/:id`            | propriétaire                                                   | —                                                                                                                                                                                                                                                      | `204` ; les entrées du créneau sont supprimées avec lui (le front demande confirmation avant)                                                                                                                                                                                                                                                                                                   | `400` « Les créneaux par défaut se masquent, ils ne se suppriment pas » · `404`           |
| `GET /api/planning/shares`                  | moi                                                            | —                                                                                                                                                                                                                                                      | mes partages : `[ { id, user: { id, firstName, lastName } \| null, weekStart: "2026-11-16" \| null } ]` (`user: null` = tout le monde ; `weekStart: null` = tout le planning)                                                                                                                                                                                                                   | —                                                                                         |
| `POST /api/planning/shares`                 | moi                                                            | `{ userId: 5 \| null, weekStart: "2026-11-16" \| null }` (`weekStart` est ramené au lundi)                                                                                                                                                             | `201` partage                                                                                                                                                                                                                                                                                                                                                                                   | `400` · `404` personne introuvable · `409` « Déjà partagé »                               |
| `DELETE /api/planning/shares/:id`           | propriétaire                                                   | —                                                                                                                                                                                                                                                      | `204`                                                                                                                                                                                                                                                                                                                                                                                           | `404`                                                                                     |
| `GET /api/planning/shared-with-me`          | moi                                                            | —                                                                                                                                                                                                                                                      | `[ { owner: { id, firstName, lastName }, allWeeks: true, weeks: ["2026-11-16"] } ]` : les personnes dont je peux voir le planning (partage à moi ou à tout le monde)                                                                                                                                                                                                                            | —                                                                                         |

Le planning partagé est en **lecture seule** : toute écriture sur le planning d'un autre est refusée (`404`, l'entrée n'existe pas pour moi).

### Précisions apportées au codage (bloc 4)

- `GET /api/planning` : `days[].entries` contient toutes les entrées du jour, triées par position du créneau puis `position` ; le front les regroupe avec `slotId`. `unknownCount` est donné dans chaque jour et dans `totals`. Le jour a `totalCalories` et `totalProteins`, la semaine `totals.calories` et `totals.proteins`.
- `servings` vaut `null` si rien n'a été donné (les calculs comptent alors 1 part). Il peut être remis à `null` par `PATCH`.
- `caloriesManual` n'est accepté que sur un texte libre (`400` sinon). Une entrée dont la recette a été supprimée peut devenir un texte libre en recevant des calories saisies. Pour un texte libre, `calories` = `caloriesManual` (non multiplié) et `proteins` = `null`.
- Lecture d'un planning partagé : `recipeAvailable` et `recipe` se jugent pour la **lectrice** (`recipe: null` si elle ne peut pas ouvrir la recette). Les calories restent celles de la propriétaire. La lectrice n'écrit rien en base.
- `PATCH /api/planning/entries/:id` : `position` est le rang voulu dans la case d'arrivée (0 = en tête, trop grand = à la fin). Sans `position`, un déplacement vers une autre case met l'entrée à la fin. Un créneau inconnu ou à une autre personne donne `404`.
- Créneaux : le nom se compare sans majuscules ni accents (`409`). Les créneaux par défaut peuvent être renommés, masqués et déplacés. `position` renumérote tous les créneaux de 0 à n.
- Partages : partager avec soi-même donne `400` sur `userId` ; `userId` et `weekStart` sont obligatoires dans le corps (`null` = tout le monde / tout le planning). `GET /api/planning/shares` renvoie d'abord le partage de tout le planning. `shared-with-me` liste les semaines précises même si `allWeeks` est vrai.

---

## 7. Liste de courses

**Plus tard.** Les tables n'existent pas encore ; le contrat sera écrit quand on attaquera cette fonctionnalité (liste générée depuis le planning sur une période, articles à cocher, ingrédients sans grammes affichés tels quels).

---

## 8. Ce que le reste du projet doit préparer

### Pour l'agent `bdd` (le back ne touche ni migrations ni modèles)

Déjà fait ou en cours côté `bdd` (décisions du 2026-11-20) :

1. **Table `sessions`** : `id`, `user_id` (cascade), `token_hash` (64, unique), `expires_at`, `last_used_at`, `created_at`, `updated_at`.
2. **Extension `unaccent`** (migration `20261120125704-enable-unaccent.cjs`), comme dans Platine : la recherche se fait par `unaccent(lower(colonne)) LIKE unaccent(lower(:recherche))`, sans colonne normalisée en plus.
3. **`meal_plan_entries.last_known_kcal_per_serving`** et **`last_known_proteins_per_serving`**.
4. Colonne existante `foods.archived_at` : sert aussi à archiver un aliment perso supprimé alors qu'il est utilisé.

### Nouvelles dépendances à valider **[Q7]**

| Paquet             | Pourquoi                                          |
| ------------------ | ------------------------------------------------- |
| `cookie-parser`    | lire le cookie de session                         |
| `multer`           | recevoir la photo envoyée par le formulaire       |
| `sharp`            | réduire la photo (1200 px de large au plus, WebP) |
| `node-html-parser` | lire les blocs `ld+json` d'une page de recette    |
| `fast-xml-parser`  | lire les fichiers XML de Ciqual                   |

Sans dépendance : mots de passe (`crypto.scrypt` intégré à Node), jetons (`crypto.randomBytes`), appels à Brevo et Open Food Facts (`fetch` intégré).

### `.env` (nouvelles variables)

`APP_URL` (adresse publique, pour les liens des e-mails), `BREVO_API_KEY`, `MAIL_FROM_EMAIL`, `MAIL_FROM_NAME`, `OFF_USER_AGENT`, `UPLOAD_DIR` (dossier des photos, défaut `server/uploads`). Sans `BREVO_API_KEY` en développement et en test, les e-mails ne partent pas : le lien est affiché dans la console du serveur.

### Commandes que l'utilisatrice lancera sur sa base `mijote`

- `cd server && npm run db:migrate` (après la migration `sessions`)
- `cd server && npm run admin:create -- ton@email.fr "Ton nom"` (crée le **premier compte admin**, demande le mot de passe dans le terminal ; sans cela personne ne peut inviter personne)
- `cd server && npm run ciqual:import -- chemin/du/dossier` (le dossier contient les 3 fichiers XML de l'ANSES, voir §4)
- Ensuite, dans l'appli : écran admin → ajouter les étiquettes.

### Tests

Les appels à Brevo, Open Food Facts et aux sites de recettes sont imités (mocks) ; la base utilisée est `mijote_test` uniquement.
