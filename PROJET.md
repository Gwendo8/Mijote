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

## Pièges

- Scan du code-barres et installation PWA : ne marchent qu'en HTTPS (ou sur localhost en développement).
- E-mails Brevo envoyés avec une adresse Gmail : risque d'arriver en indésirables tant qu'il n'y a pas de nom de domaine à soi.

## Journal

- 2026-11-19 — Cadrage et plan validés par l'utilisatrice. Squelettes serveur et client créés et vérifiés (lint, tests, build, santé de l'API).
