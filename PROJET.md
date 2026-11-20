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

Statut : faite (concept « L'addition » validé le 2026-11-20 : `DESIGN.md` et 50 maquettes Figma)

- Maquettes Figma : https://www.figma.com/design/RpJhECL8dR4BK4ZlR25lWe (pages Composants, Téléphone, PC ; une section par domaine)

- Fiche de style : `DESIGN.md` (racine)
- Inspirations : `design/inspirations/` (8 captures numérotées, planche `selection.png`, liens dans `sources.md`)
- Variantes (pages d'aperçu à ouvrir dans le navigateur) : `design/variantes/1-assiette-de-nuit.html`, `2-carnet-net.html`, `3-mi-figue-mi-raisin.html`, `4-figue-au-carnet.html` (base 3 + touches de la 2, avec deux écrans PC), `5-vert-foret.html` et `6-orange-brule.html` (variante 3 dans les deux palettes comparées ; la verte est retenue), `7a-titres-sport.html`, `7b-une-police.html`, `7c-blanc-citron.html` (pistes pour rendre le design moins « fait par IA » : police des titres, formes, couleur), `8a-cocotte-emaillee.html`, `8b-l-addition.html`, `8c-dossard.html` (3 concepts d'identité complets, téléphone et PC), `9-planning-pc-addition.html` (4 dispositions du planning PC pour « L'addition »), `10-police-textes.html` (3 polices possibles pour les textes longs) ; photos libres et crédits dans `design/variantes/img/` (`CREDITS.md`)

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
- 2026-11-20 — Couleur principale : vert forêt `#24634B` à la place du violet figue (l'utilisatrice et une amie n'aimaient pas le violet ; l'orange a été comparé). Les protéines passent en bleu `#4A7FD4` pour ne pas se confondre avec le vert. Le succès prend le même vert, reconnaissable à sa coche et à son fond.
- 2026-11-20 — Identité visuelle : concept « L'addition » (`design/variantes/8b-l-addition.html`) choisi par l'utilisatrice, qui trouvait les versions précédentes trop « faites par IA ». Planning PC : version A (ticket du jour en grand + totaux de la semaine à gauche, `9-planning-pc-addition.html`) ; à revoir dans l'appli si elle ne convient pas à l'usage.
- 2026-11-19 — Lecture seule de l'utilisatrice sur les bases : Claude crée et migre seulement `mijote_test` ; la base de dev `mijote` est créée et migrée par l'utilisatrice.

## Pièges

- Figma : Martian Mono n'y existe qu'en largeur normale (pas de version étroite ni large). Dans les maquettes, les gros chiffres sont resserrés par l'espacement des lettres ; dans l'appli, utiliser l'axe `wdth` comme décrit dans `DESIGN.md`.

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
- 2026-11-19 — `DESIGN.md`, `design/inspirations/sources.md` et `design/variantes/img/CREDITS.md` retouchés (tableaux alignés, contenu inchangé sur le fond) : mise en forme automatique par Prettier (lint-staged) au moment du commit.
- 2026-11-19 — Figma : fichier « Mijote — maquettes » créé (variables de couleur, composants). Paquet Recettes dessiné : 5 écrans en téléphone et en PC.
- 2026-11-19 — Figma : paquet Planning dessiné (jour et semaine, ajouter un plat, réglages des créneaux et du partage, planning partagé), téléphone et PC. Règle ajoutée à `DESIGN.md` : espace de 96 px sous les listes pour le bouton flottant.
- 2026-11-19 — Vert forêt `#24634B` ajouté pour les confirmations (choix de l'utilisatrice, inspiré d'une palette « Jardin frais » apparue dans le fichier Figma sans qu'on sache d'où). Figma : paquets Idées de plats et Aliments dessinés (téléphone et PC).
- 2026-11-19 — Figma : derniers paquets dessinés (Comptes, Courses, Profil et admin). 50 maquettes en tout (25 écrans, téléphone et PC, mode clair). Cartes d'une même ligne à hauteur égale (règle ajoutée à `DESIGN.md`).
- 2026-11-20 — Palette passée au vert forêt (comparaison vert / orange, choix de l'utilisatrice) : variables Figma, maquettes et `DESIGN.md` mis à jour.
- 2026-11-20 — L'utilisatrice trouve le design trop « IA » : 3 pistes d'aperçu construites (titres sportifs Big Shoulders Display, une seule police, fond blanc et touche citron), avec des formes variées selon le rôle. En attente de son choix.
- 2026-11-20 — Écrans PC (recettes avec fiche ouverte, planning de la semaine) ajoutés aux 3 aperçus de pistes, à la demande de l'utilisatrice qui veut toujours voir téléphone et PC.
- 2026-11-20 — Les pistes 7a à 7c restent trop « IA » pour l'utilisatrice, qui veut une identité unique : 3 concepts construits (Cocotte émaillée, L'addition, Dossard), téléphone et PC. En attente de son choix.
- 2026-11-20 — L'utilisatrice préfère le concept « L'addition » (8b), mais pas la disposition du planning PC : 3 dispositions ajoutées à `8b-l-addition.html` (ticket du jour + totaux de la semaine, long ticket de semaine, tableau sur papier ticket).
- 2026-11-20 — Page à part pour le planning PC de « L'addition » : versions A, B, C et une version D (tableau agrandi et aéré, menu replié en icônes), à la demande de l'utilisatrice qui trouvait le tableau trop petit et serré.
- 2026-11-20 — Concept « L'addition » retenu, planning PC en version A.
- 2026-11-20 — Police : machine à écrire (Martian Mono) partout, sauf les textes longs (étapes, descriptions, aides) dans une police classique, règle fixe par type d'élément (option A choisie par l'utilisatrice). Aperçu de 3 polices candidates pour ces textes.
- 2026-11-20 — `DESIGN.md` réécrit pour le concept « L'addition » (couleurs clair et sombre avec contrastes, Martian Mono + Atkinson Hyperlegible Next pour les textes longs, ticket, étiquette, tampon, planning PC version A).
- 2026-11-20 — Figma refait en « L'addition » : nouvelles couleurs (collection « Addition »), composants (onglets, menu PC, boutons, ticket, étiquette, tampon), paquet Recettes et Planning dessiné (téléphone et PC). Anciennes maquettes renommées « Ancien design » et rangées en bas des pages, sans suppression.
- 2026-11-20 — Figma « L'addition » terminé : 25 écrans en téléphone et en PC (Recettes, Planning, Idées, Aliments, Comptes, Courses, Profil et admin).
- 2026-11-20 — Design validé par l'utilisatrice (concept « L'addition », 50 maquettes). Prochaine étape : back.

<!-- ia-kit:synchro arbre=e6493dc74b6e12c626d236dd4ffa724e95cbd625 projet=76dcbbccdd4775fb5355f9b5775a16230a14aeb3 : point de synchro des hooks ia-kit, ne pas modifier -->
