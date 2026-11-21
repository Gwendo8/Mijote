# Mijote

Application web de cuisine et de calories, gratuite et sans IA, pensée pour le téléphone et utilisable sur PC. Pour l'autrice et ses proches.

- **Recettes** : les siennes ou importées depuis un lien, avec photo, étiquettes, nombre de parts et calories par part.
- **Idées de plats** : des aliments et leurs grammes, avec les calories et les protéines calculées.
- **Planning de la semaine** et **liste de courses**.
- **Aliments** : table Ciqual de l'ANSES et Open Food Facts (avec scan du code-barres).

**Stack** : React + Vite + Tailwind · Node.js + Express + Sequelize · PostgreSQL.

## Démarrer

Prérequis : Node.js 24 (voir `.nvmrc`) et PostgreSQL.

```bash
npm install                              # racine (outils de formatage et hooks Git)
cd server && npm install && cp .env.example .env   # puis remplir .env
npm run db:migrate                       # crée les tables
npm run dev                              # API → http://localhost:3000/api/health
cd ../client && npm install && npm run dev   # Front → http://localhost:5173
```

## En savoir plus

- `PROJET.md` : le besoin, l'état du projet, les décisions et les pièges.
- `server/README.md` et `client/README.md` : l'organisation du code.

Données : Ciqual (ANSES), Open Food Facts, USDA FoodData Central (mesures ménagères : densités et poids des pièces).
