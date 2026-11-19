# PROJET.md — Mijote

Document vivant du projet : besoin, fonctionnalités et leurs fichiers, décisions, pièges, journal.

## Besoin (cadrage validé le 2026-11-19)

Mijote est une appli web gratuite, sans IA, sur le serveur maison de l'utilisatrice. Pensée d'abord pour le téléphone (installable sur l'écran d'accueil), elle marche aussi sur PC. Elle sert à garder ses recettes au même endroit, à planifier ses repas et à ne plus rechercher sans arrêt les calories des mêmes plats, en particulier pendant une sèche.

**Utilisateurs** : l'utilisatrice et ses proches au début, peut-être tout le monde plus tard.

- Comptes sur invitation, avec un réglage admin pour ouvrir l'inscription libre plus tard.
- Mot de passe oublié par e-mail (Brevo), plus réinitialisation par l'admin. Suppression de compte.
- Admin (l'utilisatrice) : comptes, réglages, seule à corriger les aliments communs.
- Chacun ne modifie que ses propres données ; ce qui lui est partagé, il le voit ou le copie chez lui.

**V1**

1. **Recettes** : perso ou importées par lien (fiche schema.org Recipe des sites de recettes ; TikTok : lien gardé, recette tapée à la main). Photo (importée ou prise au téléphone, réduite automatiquement), nombre de parts ajustable, étiquettes dans une liste fixe, calories et protéines par part si les ingrédients sont reliés à des aliments (sinon « à compléter »), recherche et filtres. Visibilité : privée, partagée avec des personnes choisies, ou visible par tous.
2. **Idées de plats** : sans étapes, aliments + grammes, calories et protéines calculées et corrigeables, étiquettes, même partage que les recettes.
3. **Aliments** : Ciqual chargé en base (calories, protéines, glucides, lipides) ; Open Food Facts pour les produits du commerce, avec scan du code-barres ; aliments personnels de chacun ; corrections des aliments communs réservées à l'admin, valeur d'origine conservée.
4. **Planning de la semaine** : 4 créneaux par défaut (petit-déj, midi, collation, soir), masquables ou complétables par chacun ; on y met une recette, une idée de plat ou un texte libre ; total des calories prévues par jour ; partage en lecture seule.
5. **Liste de courses** générée depuis le planning, en dernier dans la V1 (bascule en V2 si besoin). Les ingrédients sans grammes précis s'affichent tels quels.

**Plus tard (V2)** : journal de ce qu'on mange vraiment (recette ou idée en parts ou en grammes, ou aliment + grammes) et suivi du déficit ; modification d'un planning partagé ; nom de domaine acheté.

**Hébergement** : serveur maison (Ubuntu, Caddy, Node 24, PostgreSQL 18), adresse HTTPS gratuite Tailscale Funnel (2e appli sur 3), e-mails Brevo déjà réglés pour Platine. Voir `~/Documents/serveur-maison/NOTES-SERVEUR.md`. Pas de délai.

## Fonctionnalités

Statuts : à faire / en cours / faite.

### Socle serveur (santé de l'API)

Statut : faite

- `server/src/app.js`, `server/src/server.js`, `server/src/routes/health.routes.js`, `server/src/controllers/health.controller.js`

### Socle client (page d'accueil, appel santé)

Statut : faite

- `client/src/main.jsx`, `client/src/router.jsx`, `client/src/pages/home/HomePage.jsx`

### Base de données (schéma, migrations, modèles)

Statut : faite (bases `mijote_test` et `mijote` créées et migrées)

- Schéma de référence : `server/src/database/schema.dbml` (diagramme exiDraw « mijote — schéma BDD »)
- Migrations : `server/src/database/migrations/20261119150001-create-users.cjs` à `…150014-create-planning-shares.cjs` (14 tables)
- Modèles et relations : `server/src/models/*.js`, relations dans `server/src/models/index.js`
- Tests : `server/tests/models.test.js` (suppressions, unicités)
- Tables de la liste de courses (`shopping_lists`, `shopping_list_items`) : dessinées dans le schéma, créées quand on attaquera la fonctionnalité.

### Design (style, DESIGN.md, maquettes Figma)

Statut : en cours (variante 3 retenue, `DESIGN.md` écrit ; 50 maquettes Figma faites, téléphone et PC, en attente de validation)

- Maquettes Figma : https://www.figma.com/design/RpJhECL8dR4BK4ZlR25lWe (pages Composants, Téléphone, PC ; une section par domaine)

- Fiche de style : `DESIGN.md` (racine)
- Inspirations : `design/inspirations/` (8 captures numérotées, planche `selection.png`, liens dans `sources.md`)
- Variantes (pages d'aperçu à ouvrir dans le navigateur) : `design/variantes/1-assiette-de-nuit.html`, `2-carnet-net.html`, `3-mi-figue-mi-raisin.html`, `4-figue-au-carnet.html` (base 3 + touches de la 2, avec deux écrans PC) ; photos libres et crédits dans `design/variantes/img/` (`CREDITS.md`)

### Comptes (invitations, connexion, mot de passe oublié, admin, suppression)

Statut : à faire

### Aliments (Ciqual, Open Food Facts, scan, aliments perso, corrections admin)

Statut : à faire

### Recettes (création, import par lien, photo, parts, étiquettes, calories, recherche, partage)

Statut : à faire

### Idées de plats

Statut : à faire

### Planning de la semaine

Statut : à faire

### Liste de courses

Statut : à faire

## Décisions

- 2026-11-19 — Pas d'IA : l'import par lien lit la fiche schema.org Recipe des pages ; TikTok n'en a pas, donc lien seul et saisie manuelle.
- 2026-11-19 — Corrections d'aliments Ciqual stockées à côté de la donnée d'origine, pour recharger une nouvelle table Ciqual sans perdre les corrections.
- 2026-11-19 — Comptes sur invitation, avec un réglage pour ouvrir l'inscription plus tard, car l'appli pourra être ouverte au public.
- 2026-11-19 — Calories des recettes facultatives (« à compléter ») pour ne pas rendre chaque ajout pénible.
- 2026-11-19 — Un seul dépôt (mono), stack habituelle ia-kit. Ordre : bdd → design → back → front → auditeur.
- 2026-11-19 — Schéma : recettes et idées de plats dans une seule table `recipes` (colonne `kind`), mais deux boutons, formulaires et listes distincts dans l'appli. Pourquoi : planning, partage, étiquettes et futur journal pointent vers un seul endroit.
- 2026-11-19 — Tous les aliments (Ciqual, Open Food Facts gardés en cache, perso) dans une seule table `foods` (colonne `source`), pour qu'un ingrédient pointe vers « un aliment » sans se soucier de l'origine.
- 2026-11-19 — Calories recalculées à chaque affichage (jamais stockées), sauf correction à la main par part (recettes et idées). Case « négligeable » sur l'ingrédient (sel, poivre) : compte pour 0 sans bloquer le calcul.
- 2026-11-19 — Copier une recette partagée copie aussi les aliments perso de son autrice qu'elle utilise, et la photo (à faire par le back).
- 2026-11-19 — Suppression réelle partout, sans corbeille. Supprimer un compte supprime tout ce qu'il possède, y compris ses recettes publiques (les copies faites par d'autres restent). Recette supprimée : les cases du planning gardent son titre en texte libre.
- 2026-11-19 — Planning en semaines datées ; plusieurs plats possibles par case (créneau d'un jour). Partage : à une personne ou à tout le monde, de tout le planning ou de semaines choisies, en lecture seule.
- 2026-11-19 — 4 créneaux par défaut créés par le back à l'inscription (masquables) ; ceux ajoutés se suppriment, avec ce qu'ils contiennent, après confirmation.
- 2026-11-19 — Pas de seeders : étiquettes saisies par l'admin dans l'écran admin. Liste proposée : Petit-déj, Plat, Dessert, Collation, Végé, Rapide, Batch cooking, Riche en protéines, Léger.
- 2026-11-19 — Réinitialisation par l'admin = un lien envoyé à la personne (l'admin ne connaît jamais le mot de passe).
- 2026-11-19 — Design : variante 3 « Mi-figue mi-raisin » retenue (violet figue, assiettes rondes avec anneau protéines / glucides / lipides, Gloock + Schibsted Grotesk, clair et sombre). Les touches « carnet » de la 2 ont été essayées (variante 4) puis écartées par l'utilisatrice ; seule la disposition des écrans PC de la 4 est gardée.
- 2026-11-19 — Vert forêt `#24634B` réservé aux confirmations (succès, « relié à un aliment ») : jamais pour les calories ni les boutons, pour ne pas le confondre avec le vert des protéines.
- 2026-11-19 — Lecture seule de l'utilisatrice sur les bases : Claude crée et migre seulement `mijote_test` ; la base de dev `mijote` est créée et migrée par l'utilisatrice.

## Pièges

- Figma, offre Starter : 3 pages maximum par fichier (Composants, Téléphone, PC). Les outils de lecture du serveur Figma (captures, métadonnées) peuvent être limités ; les captures se font depuis `use_figma` (`node.screenshot()`).

- Scan du code-barres et installation PWA : ne marchent qu'en HTTPS (ou sur localhost en développement).
- Unicité avec valeurs vides (`planning_shares`) : PostgreSQL considère deux NULL comme différents ; l'index unique utilise `NULLS NOT DISTINCT` (PostgreSQL 15+), écrit en SQL dans la migration.
- `password_hash` et `token_hash` ne doivent jamais sortir dans une réponse de l'API.
- Les aliments perso d'une personne doivent rester lisibles par ceux qui voient une recette partagée qui les utilise.
- exiDraw refuse de rendre l'aperçu d'un schéma de 16 tables (« Rendu trop long ») : vérifier la mise en page en ouvrant exiDraw. Compte gratuit plein (3 documents sur 3) : mettre à jour le diagramme existant.
- E-mails Brevo envoyés avec une adresse Gmail : risque d'arriver en indésirables tant qu'il n'y a pas de nom de domaine à soi.

## Journal

- 2026-11-19 — Cadrage et plan validés par l'utilisatrice. Squelettes serveur et client créés et vérifiés (lint, tests, build, santé de l'API).
- 2026-11-19 — Schéma de la base validé par l'utilisatrice (14 tables + 2 pour les courses plus tard). Migrations, modèles et tests écrits, vérifiés sur `mijote_test`.
- 2026-11-19 — Design commencé : goûts de l'utilisatrice recueillis (frais et sportif, soigné façon Apple, pas magazine, clair et sombre, chiffres visibles), 8 inspirations Dribbble sélectionnées.
- 2026-11-19 — Inspirations notées par l'utilisatrice (aime 1, 2, 5, 7). Trois variantes construites : Assiette de nuit (sombre, sportif), Carnet net (clair, cahier), Mi-figue mi-raisin (anneau des macros autour des assiettes).
- 2026-11-19 — Variante 1 écartée, la 3 préférée avec un faible pour l'ambiance de la 2 : variante 4 « Figue au carnet » construite, avec les écrans PC Recettes et Planning de la semaine.
- 2026-11-19 — Variante 3 retenue par l'utilisatrice. `DESIGN.md` écrit (couleurs avec contrastes vérifiés, typographie, composants, animations, responsive).
- 2026-11-19 — `DESIGN.md`, `design/inspirations/sources.md` et `design/variantes/img/CREDITS.md` retouchés (tableaux alignés, contenu inchangé sur le fond) : ❓ à demander.
- 2026-11-19 — Figma : fichier « Mijote — maquettes » créé (variables de couleur, composants). Paquet Recettes dessiné : 5 écrans en téléphone et en PC.
- 2026-11-19 — Figma : paquet Planning dessiné (jour et semaine, ajouter un plat, réglages des créneaux et du partage, planning partagé), téléphone et PC. Règle ajoutée à `DESIGN.md` : espace de 96 px sous les listes pour le bouton flottant.
- 2026-11-19 — Vert forêt `#24634B` ajouté pour les confirmations (choix de l'utilisatrice, inspiré d'une palette « Jardin frais » apparue dans le fichier Figma sans qu'on sache d'où). Figma : paquets Idées de plats et Aliments dessinés (téléphone et PC).
- 2026-11-19 — Figma : derniers paquets dessinés (Comptes, Courses, Profil et admin). 50 maquettes en tout (25 écrans, téléphone et PC, mode clair). Cartes d'une même ligne à hauteur égale (règle ajoutée à `DESIGN.md`).

<!-- ia-kit:synchro arbre=7c97b093633907a6a1e709768123ca9c3d837311 projet=b405a59ddab28f6924032450973f78deed9d8150 : point de synchro des hooks ia-kit, ne pas modifier -->
