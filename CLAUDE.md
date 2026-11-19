# Mijote

Application web perso de cuisine et de calories, 100 % gratuite et sans IA, hébergée sur le serveur maison de l'utilisatrice. Pensée d'abord pour le téléphone (PWA installable), adaptée au PC. Recettes (perso ou importées par lien), idées de plats (aliments + grammes, calories calculées), planning de la semaine, liste de courses. Aliments : Ciqual (chargé en base) puis Open Food Facts (avec scan du code-barres) puis saisie manuelle. Plus tard : journal alimentaire et suivi du déficit. Le besoin validé est dans `PROJET.md`, section « Besoin ».

**Stack** : React + Vite + Tailwind (`client/`) · Node.js + Express + Sequelize (`server/`) · PostgreSQL · maquettes Figma. Un seul dépôt (mono).

## Règles du projet

- Tout en français (interface, messages, commentaires, documentation).
- Aucune IA, rien de payant : données Ciqual et Open Food Facts, sources citées dans l'appli (« Données : Ciqual (ANSES), Open Food Facts »).
- Plusieurs utilisateurs : comptes sur invitation (réglage admin pour ouvrir l'inscription plus tard). Chacun ne modifie que ses propres données ; ce qui est partagé se voit ou se copie. Droits toujours vérifiés par le serveur.
- Aliments Ciqual : jamais modifiés en place. Les corrections (réservées à l'admin) sont stockées à côté, la valeur d'origine reste disponible.
- Mots de passe et secrets uniquement dans `server/.env` (jamais versionné).
- Respecter l'organisation décrite dans `server/README.md` (couches) et `client/README.md` (domaines).

## Démarrer

```bash
cd server && npm run dev   # API → http://localhost:3000/api/health
cd client && npm run dev   # Front → http://localhost:5173
```

Autres commandes : `npm test` et `npm run lint` (dans chaque dossier), `npm run db:migrate` (server), `npm run format` (racine).

## Carte du projet

PROJET.md décrit les fonctionnalités, les fichiers qui les composent, les décisions et les pièges. Avant de chercher dans le code pour modifier ou réparer une fonctionnalité, consulte sa section dans PROJET.md pour savoir directement quels fichiers ouvrir.
