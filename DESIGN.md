# DESIGN.md — Mijote

Fiche de style de l'application. Le `front` la suit à la lettre. Aperçu de référence, à ouvrir dans un navigateur : `design/variantes/3-mi-figue-mi-raisin.html` (téléphone). Pour l'ordinateur, la **disposition** des écrans PC de `design/variantes/4-figue-au-carnet.html` est retenue, mais **sans** ses touches « carnet » (quadrillage, trait de marge, ingrédients en lignes, total en Gloock). En cas de doute, ce fichier fait foi, puis les maquettes Figma (liens dans `PROJET.md`).

Variante retenue par l'utilisatrice le 2026-11-19 : **3, « Mi-figue mi-raisin »**.

## 1. Intention

Mijote mêle le plaisir de cuisiner et le suivi des calories. Le dessin réunit les deux. Le plat est une **assiette ronde**, et un **anneau** autour d'elle montre d'un coup d'œil d'où viennent ses calories (protéines, glucides, lipides). Le style est frais et soigné, façon Apple : beaucoup de rond, des titres élégants, des chiffres nets et bien visibles sans être criards.

- **Mots-clés** : frais, soigné, gourmand, rond, lisible, entre proches.
- **Références** (`design/inspirations/sources.md`) : n° 5 (plats ronds sur fond sombre), n° 7 (pastilles de couleur par nutriment, titres à empattements), n° 1 (gros chiffres), n° 2 (élégance sobre).
- **Signature à préserver** : l'anneau des macros autour de chaque assiette.
- **À ne jamais faire** :
  - le style magazine (grandes photos pleine page, colonnes de texte) ;
  - des photos envahissantes façon Instagram : la photo reste dans son rond ;
  - des dégradés décoratifs, des effets verre, des emojis à la place des icônes ;
  - des libellés en MAJUSCULES ou une numérotation « 01 / 02 » décorative ;
  - une troisième police.

## 2. Couleurs

Variables CSS sur `:root`. Le mode suit le réglage du téléphone (`prefers-color-scheme`), avec un réglage manuel « Clair / Sombre / Automatique » dans le profil, qui pose `data-theme` sur `<html>`.

| Rôle                                                                                     | Variable         | Clair     | Sombre    |
| ---------------------------------------------------------------------------------------- | ---------------- | --------- | --------- |
| Fond de page                                                                             | `--fond`         | `#F4F1F6` | `#1A1220` |
| Surface (cartes, barres, champs)                                                         | `--surface`      | `#FFFFFF` | `#251A2D` |
| Surface secondaire (boutons ronds, puces inactives au survol)                            | `--surface-2`    | `#EBE5EF` | `#31243A` |
| Bordure, séparateur                                                                      | `--ligne`        | `#DDD4E3` | `#3C2D47` |
| Texte                                                                                    | `--texte`        | `#24142C` | `#F3ECF6` |
| Texte secondaire                                                                         | `--texte-2`      | `#67586F` | `#B9A9C3` |
| Primaire « figue » (fonds de boutons, puce active, total du jour)                        | `--kcal`         | `#8A2D6B` | `#E58BC6` |
| Figue écrite (calories, liens)                                                           | `--kcal-texte`   | `#8A2D6B` | `#EFA3D3` |
| Texte posé sur la figue                                                                  | `--sur-kcal`     | `#FFFFFF` | `#2A0D20` |
| Protéines, anneau                                                                        | `--prot`         | `#7DB24A` | `#A6D774` |
| Protéines, texte                                                                         | `--prot-texte`   | `#42701C` | `#B4DE88` |
| Glucides, anneau                                                                         | `--gluc`         | `#E3AA3A` | `#F0C063` |
| Lipides, anneau                                                                          | `--lip`          | `#D7709B` | `#F08BB0` |
| Erreur                                                                                   | `--erreur`       | `#B3261E` | `#FF8F86` |
| Fond d'erreur (champ invalide)                                                           | `--erreur-fond`  | `#FBEAEA` | `#3B1C25` |
| Figue claire (onglet actif, encadrés d'info, choix sélectionné)                          | `--kcal-leger`   | `#F1E6ED` | `#3A2340` |
| Succès « vert forêt » (confirmations, coche « relié à un aliment », « Recette trouvée ») | `--succes`       | `#24634B` | `#7FD1A8` |
| Fond de succès (message de confirmation)                                                 | `--succes-leger` | `#EFF4ED` | `#1D3A2E` |
| Contour de focus                                                                         | `--focus`        | `#8A2D6B` | `#EFA3D3` |

**Succès** : le vert forêt sert seulement aux confirmations, jamais aux calories ni aux boutons. Il se distingue du vert clair des protéines par sa teinte plus sombre et plus bleutée, et il est toujours accompagné d'une icône de coche. Choisi par l'utilisatrice le 2026-11-19, à partir d'une palette « Jardin frais ».

**Contrastes vérifiés** (WCAG AA : 4,5:1 pour le texte) :

| Paire                                   | Clair       | Sombre      |
| --------------------------------------- | ----------- | ----------- |
| Texte sur fond / sur surface            | 15,5 / 17,3 | 15,8 / 14,4 |
| Texte secondaire sur fond / sur surface | 5,9 / 6,6   | 8,3 / 7,5   |
| Figue écrite sur surface / sur fond     | 7,9 / 7,0   | 8,6 / 9,4   |
| Texte sur bouton figue                  | 7,9         | 7,5         |
| Protéines (texte) sur surface           | 5,9         | 10,9        |
| Erreur sur fond d'erreur / sur fond     | 5,6 / 5,8   | 6,9 / 8,3   |
| Succès sur surface / sur fond de succès | 7,1 / 6,4   | 9,2 / 6,8   |

Les couleurs `--prot`, `--gluc` et `--lip` ne servent **qu'aux formes** (anneau, pastilles de légende) : elles ne portent jamais seules une information. Les grammes sont toujours écrits à côté.

## 3. Typographie

Deux polices Google Fonts, gratuites :

- **Gloock** (400, à empattements, fort contraste) : titres d'écran, titre de recette, titres de section (Ingrédients, Étapes, nom des créneaux du planning), numéros des étapes. Jamais pour un texte courant ni un chiffre de calories.
- **Schibsted Grotesk** (400 à 800) : tout le reste, y compris les chiffres (`font-variant-numeric: tabular-nums`, graisse 800, `letter-spacing: -0.02em`).

Chargement : `https://fonts.googleapis.com/css2?family=Gloock&family=Schibsted+Grotesk:wght@400..800&display=swap`

| Usage                              | Police      | Taille (téléphone) | Taille (PC)     | Interlignage |
| ---------------------------------- | ----------- | ------------------ | --------------- | ------------ |
| Titre d'écran (Recettes, Planning) | Gloock      | 38 px              | 40 px           | 1,05         |
| Titre de fiche recette             | Gloock      | 36 px              | 32 px (panneau) | 1,05         |
| Titre de formulaire                | Gloock      | 28 px              | 32 px           | 1,1          |
| Titre de section, créneau          | Gloock      | 21 à 24 px         | 24 px           | 1,2          |
| Gros chiffre (total du jour)       | Grotesk 800 | 50 px              | 50 px           | 0,95         |
| Chiffre de tuile (kcal, protéines) | Grotesk 800 | 40 px              | 40 px           | 1            |
| Chiffre de carte                   | Grotesk 800 | 22 px              | 22 px           | 1            |
| Texte courant, champs              | Grotesk 400 | 16 px              | 16 px           | 1,45         |
| Libellé de champ, bouton           | Grotesk 700 | 14 à 16 px         | 14 à 16 px      | 1,3          |
| Méta (durée, parts), légende       | Grotesk 400 | 12 à 13 px         | 13 px           | 1,4          |

Les champs de saisie gardent 16 px minimum : en dessous, l'iPhone zoome sur la page quand on touche le champ.

## 4. Espacements et grille

- **Échelle** : 4, 6, 8, 10, 12, 14, 18, 24, 32 px.
- **Téléphone** : marge latérale de 18 px, écart de 10 px entre les cartes, 18 px entre deux sections.
- **PC** : menu latéral de 220 px, contenu avec 30 px de marge intérieure, panneau de fiche de 400 px.
- **Largeur max** : 1440 px de contenu, centré, au-delà.
- **Zones à toucher** : 44 × 44 px minimum (boutons ronds, cases, flèches).

## 5. Formes

- **Arrondis** : tout ce qui est petit ou interactif est une pilule (`999px` : boutons, puces, champ de recherche, sélecteur de parts, plats du planning, barre de la semaine). Les cartes et les tuiles ont 22 à 28 px. Les champs de formulaire ont 16 px. Les assiettes sont des cercles.
- **Bordures** : seulement pour séparer (1 px `--ligne`) ou pour un état (focus, erreur, texte libre en pointillés).
- **Ombres** : aucune sur les cartes. Une seule ombre colorée, sous le bouton flottant « Nouvelle recette » : `0 10px 24px` avec la figue à 40 %.

## 6. Composants

### Assiette et anneau (composant clé)

- **Assiette** : photo de la recette recadrée en cercle (`object-fit: cover`).
- **Anneau** : cercle autour de l'assiette, en `conic-gradient`. Il part du haut et tourne dans le sens des aiguilles d'une montre : protéines (`--prot`), puis glucides (`--gluc`), puis lipides (`--lip`). La part de chaque couleur est la **part des calories** qui vient de ce nutriment : protéines × 4, glucides × 4, lipides × 9, divisé par le total.
- Entre l'anneau et la photo, un liseré de la couleur du fond qui entoure l'assiette (3 px), pour détacher la photo.
- **Épaisseur de l'anneau** : 9 px pour la fiche (228 px), 5 px pour les cartes (112 px), 3 px pour le planning (58 px), 2 px pour les mini-plats PC (30 px).
- **Sans photo** : assiette teintée de figue (14 %) avec un cercle intérieur clair et l'icône « couverts » au centre. Elle reste jolie et ne laisse aucun trou gris.
- **Calories inconnues** (ingrédients pas reliés à des aliments) : anneau en pointillés gris (`repeating-conic-gradient` de `--ligne`), et à la place du chiffre la pastille « kcal à compléter ».
- **Légende** (fiche seulement) : trois pastilles de 10 px, chacune suivie du nom et des grammes (« Protéines 17 g »).

### Boutons

| Type                          | Style                                                                              | États                                                                                                                                                                                |
| ----------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Principal                     | Pilule figue, texte `--sur-kcal`, 54 px de haut                                    | survol : `brightness(1.1)` ; focus : contour 3 px `--focus` décalé de 2 px ; désactivé : opacité 0,5 ; chargement : roue qui tourne et libellé « Enregistrement… », bouton désactivé |
| Secondaire                    | Pilule `--surface`, texte `--texte`                                                | survol : fond `--surface-2`                                                                                                                                                          |
| Flottant « Nouvelle recette » | Pilule figue 56 px, icône + texte, en bas à droite au-dessus de la barre d'onglets | ombre colorée (seule ombre de l'appli)                                                                                                                                               |
| Rond (retour, +/−)            | Cercle 44 px, `--surface` ou `--surface-2`                                         | survol : figue à 18 % ; désactivé (− à 1 part) : opacité 0,4                                                                                                                         |
| Ajouter dans le planning      | Pilule en pointillés `--ligne`, texte figue                                        | survol : bordure `--texte-2`                                                                                                                                                         |

Le bouton flottant reste fixe pendant que la liste défile dessous. La liste garde un espace vide de 96 px en bas : le dernier élément remonte au-dessus du bouton et n'est jamais caché.

Libellés : un verbe qui dit ce qui se passe (« Enregistrer l'idée », « Mettre au planning »), sans flèche.

### Champs

- Fond `--surface`, sans bordure visible au repos (bordure transparente de 1,5 px), arrondi 16 px, 50 px de haut.
- Focus : bordure `--focus`.
- Erreur : bordure `--erreur`, fond `--erreur-fond`. Dessous, le message en `--erreur`, 13 px, graisse 600, avec une icône d'alerte. Le message dit quoi faire : « Indique un poids en grammes, par exemple 150. »
- Recherche : pilule de 48 px avec une loupe à gauche.
- Liste de résultats d'aliments : carte `--surface` arrondie à 20 px, une ligne par aliment (nom, pastille de source « Ciqual », « Open Food Facts » ou « Mon aliment », calories pour 100 g en figue, protéines en petit).

### Puces (filtres et étiquettes)

- Puce de filtre : pilule `--surface`, texte `--texte-2`, graisse 600. Active (`aria-pressed="true"`) : fond figue, texte `--sur-kcal`. Défilement horizontal sur téléphone.
- Étiquette affichée (sur une fiche) : petite pilule `--surface`, 12 px.

### Cartes de recette (liste)

- Grille de **2 colonnes** sur téléphone, `auto-fill` de 170 px minimum sur PC.
- Contenu centré : assiette avec anneau (112 px), titre (15 px, 700), méta (durée, parts, « de Léa » pour une recette partagée), puis en bas les calories par part en figue et les protéines en vert.
- Les cartes d'une même ligne ont toutes la même hauteur (celle de la plus haute). Les calories et les protéines restent collées en bas de la carte, pour être alignées d'une carte à l'autre, même quand un titre tient sur deux lignes.
- Survol (PC) : la carte monte de 2 px et l'anneau tourne de −8°.
- Carte choisie (PC, fiche ouverte à droite) : contour figue de 2 px.

### Fiche recette

Assiette avec anneau, titre, durée, légende des macros, étiquettes. Ensuite : deux tuiles (calories par part en figue, protéines par part en vert), le sélecteur de parts (pilule avec − et +), les ingrédients (carte avec cases à cocher rondes, grammes recalculés selon les parts, « négligeable » pour le sel et les épices), les étapes (numéros en Gloock figue), puis la source (« Calculé avec Ciqual », visibilité).

### Planning

- Barre de la semaine : pilule `--surface` avec les 7 jours ; le jour choisi en figue.
- Total du jour : grande carte figue, texte `--sur-kcal`, date en petit au-dessus, calories en très gros à gauche et protéines à droite.
- Créneau : nom en Gloock, total du créneau à droite ; chaque plat est une pilule `--surface` (assiette avec anneau de 58 px, titre, « 1 part » ou « Idée de plat, 1 part », calories en figue).
- Texte libre : même pilule, mais sans fond, en pointillés, avec l'assiette sans photo.

### Navigation

- **Téléphone** : barre d'onglets en bas, 5 entrées : Recettes, Idées, Planning, Courses, Aliments. L'onglet actif a un fond figue à 12 % et un texte figue en gras. Le profil et l'admin sont accessibles depuis un bouton rond en haut à droite des écrans principaux.
- **PC** : menu latéral à gauche (logo « Mijote » en Gloock figue, mêmes 5 entrées avec icône et libellé, mention des sources des données en bas).

### Fenêtres (confirmations, choix)

- Téléphone : panneau qui monte du bas (feuille), arrondi 28 px en haut, fond `--surface`, poignée grise.
- PC : fenêtre centrée de 480 px, arrondie à 28 px, fond assombri derrière (noir à 40 %).
- Suppression : le bouton de confirmation est en `--erreur` et nomme l'action (« Supprimer le créneau et ses 3 plats »).

### États vides et chargement

- **Vide** : assiette sans photo (96 px) avec une icône, une phrase qui dit quoi faire, et un bouton (« Voir toutes les recettes », « Ajouter une recette »).
- **Chargement** : formes grises qui pulsent doucement (cercle pour l'assiette, barres pour le texte), à la place du contenu attendu. Pas de roue au milieu de l'écran.
- **Données** : mention « Données : Ciqual (ANSES), Open Food Facts » dans le menu PC et sur la page Aliments.

## 7. Icônes et illustrations

- **Icônes** : [Lucide](https://lucide.dev) (licence ISC, gratuite, sans crédit obligatoire) via `lucide-react`. Trait de 1,8, extrémités arrondies, 22 px dans la navigation, 14 à 16 px dans les méta. Icônes utilisées : `search`, `plus`, `minus`, `clock`, `circle-dot` (parts), `chevron-left`, `book`, `lightbulb`, `calendar`, `shopping-cart`, `apple`, `scan-barcode`, `check`, `share-2`, `circle-alert`, `pencil`, `utensils` (assiette sans photo).
- **Illustrations** : aucune. L'assiette sans photo tient ce rôle.
- **Photos** : celles des utilisatrices et utilisateurs, réduites automatiquement. Les photos de `design/variantes/img/` servent seulement aux aperçus (crédits dans `CREDITS.md`).

## 8. Animations

Rares, et toujours en réponse à un geste.

| Quoi                                   | Comment                                                            | Durée, courbe                                |
| -------------------------------------- | ------------------------------------------------------------------ | -------------------------------------------- |
| Survol d'une carte (PC)                | carte −2 px, anneau −8°                                            | 250 ms et 400 ms, `cubic-bezier(.2,.8,.2,1)` |
| Changer le nombre de parts             | le chiffre glisse de −6 px en fondu, les grammes se mettent à jour | 220 ms, même courbe                          |
| Cocher un ingrédient                   | la coche grandit avec un léger rebond, le texte est barré          | 250 ms, `cubic-bezier(.3,1.6,.5,1)`          |
| Ouvrir une feuille ou une fenêtre      | montée depuis le bas (téléphone), fondu et léger zoom (PC)         | 250 ms entrée, 200 ms sortie                 |
| Ajouter ou retirer un plat du planning | la liste se réorganise en douceur                                  | AutoAnimate, 200 ms                          |
| Changer de puce ou d'onglet            | couleur de fond et de texte                                        | 150 ms                                       |

- **`prefers-reduced-motion: reduce`** : toutes les durées passent à 0. Les changements restent visibles, sans mouvement.
- **Bibliothèque** : [AutoAnimate](https://auto-animate.formkit.com) (`@formkit/auto-animate`, licence MIT) pour les listes. Le reste se fait en CSS (`transition`, `@keyframes`) et avec `element.animate()`. Motion n'est pas nécessaire.

## 9. Responsive

| Largeur                     | Disposition                                                                                                                                                                                                                                                                                                                                                                                                                       |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Moins de 768 px (téléphone) | Barre d'onglets en bas ; un écran à la fois ; grille de recettes en 2 colonnes ; planning jour par jour avec la barre de la semaine ; formulaires en pleine largeur ; fenêtres en feuille qui monte du bas                                                                                                                                                                                                                        |
| 768 à 1023 px (tablette)    | Comme le téléphone, mais grille de recettes en 3 colonnes, contenu centré sur 720 px max                                                                                                                                                                                                                                                                                                                                          |
| 1024 px et plus (PC)        | Menu latéral à gauche. **Recettes et idées** : grille au milieu, fiche ouverte dans un panneau de 400 px à droite (la liste reste visible). **Planning** : tableau de la semaine (7 jours en colonnes, créneaux en lignes), jour actuel surligné en figue à 10 %, total des calories et des protéines en bas de chaque jour ; un bouton + apparaît au survol d'une case. **Formulaires** : centrés, 640 px max. Fenêtres centrées |

Application installable (PWA) : couleur du thème `#8A2D6B` (clair) et `#1A1220` (sombre), écran de démarrage sur `--fond`. L'icône sera une assiette avec son anneau, à dessiner avec les maquettes.
