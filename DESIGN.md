# DESIGN.md — Mijote

Fiche de style de l'application. Elle donne les couleurs, polices, composants et règles qui servent partout, en téléphone et en PC. Le `front` s'y tient pour chaque écran et compare son rendu à l'aperçu de référence avant de rendre la main. Si un écran n'est pas dans l'aperçu, il suit les règles de ce fichier ; en cas de doute ou de contradiction, le front le signale.

Aperçu de référence, à ouvrir dans un navigateur :

- `design/variantes/12-mixte.html` : connexion, recettes (avec les filtres) et planning, téléphone et grand écran.
- Pour mémoire : `11a-anneaux.html` (la base) et `11b-tickets-couleur.html` (d'où viennent les papiers de couleur).

Style retenu par l'utilisatrice le 2026-11-25 : **« Anneaux et papiers »** (variante 12, mélange de 11A et 11B). Il remplace « L'addition » (2026-11-20), jugé trop sérieux : fond gris beige, vert foncé, pages pas assez remplies, grands écrans mal utilisés. Les maquettes Figma de « L'addition » ne font plus foi pour l'habillage ; elles restent valables pour le contenu et l'ordre des éléments de chaque écran.

## 1. Intention

Mijote doit être gai, net et lisible d'un coup d'œil, comme une appli de sport douce. Deux idées portent tout :

- **L'anneau des macros** : un anneau protéines, glucides, lipides entoure chaque photo de recette, chaque jour de la semaine et la journée en cours. C'est la signature, on le reconnaît partout.
- **Les papiers de couleur** : chaque moment de la journée a son papier (beurre le matin, menthe à midi, pêche pour la collation, ciel le soir). Le planning est une pile de tickets de ces couleurs, et ces couleurs reviennent ailleurs pour dire « c'est prévu à ce moment-là » (talon sur les recettes, bandeau du jour, connexion).

- **Mots-clés** : clair, gai, propre, rond, chiffres alignés.
- **Signatures à préserver** :
  - l'anneau des macros autour des photos et des jours ;
  - le ticket aux bords dentelés, sur le papier de son créneau ;
  - le petit talon de ticket posé en biais (recettes déjà au planning, connexion).
- **À ne jamais faire** :
  - des dégradés décoratifs, des effets verre, des lueurs, des emojis à la place des icônes ;
  - une deuxième police ;
  - des papiers de couleur sans lien avec un créneau (ils ont un sens, ce n'est pas de la déco) ;
  - du texte en capitales (ni boutons, ni titres, ni mentions) ;
  - une flèche « → » ajoutée aux libellés.
- **Le biais** (rotation) est réservé aux petits tickets décoratifs : talon des recettes, tickets de la connexion. Les tickets du planning restent droits.

## 2. Couleurs

Variables CSS sur `:root`. Le mode suit le réglage de l'appareil (`prefers-color-scheme`), avec un réglage manuel « Automatique / Clair / Sombre » dans le profil, qui pose `data-theme` sur `<html>`.

| Rôle                                              | Variable         | Clair     | Sombre    |
| ------------------------------------------------- | ---------------- | --------- | --------- |
| Fond des pages                                    | `--fond`         | `#F4F6FA` | `#13161D` |
| Surface (cartes, panneaux, menu, onglets, champs) | `--surface`      | `#FFFFFF` | `#1E222C` |
| Encre (texte)                                     | `--encre`        | `#1C2230` | `#ECEFF5` |
| Encre pâle (texte secondaire)                     | `--encre-2`      | `#5A6275` | `#A3AABA` |
| Traits et séparateurs                             | `--trait`        | `#E3E7EF` | `#2E3442` |
| Tomate (bouton principal, jour choisi, liens)     | `--tomate`       | `#D63A2F` | `#FF7A6B` |
| Texte posé sur la tomate                          | `--sur-tomate`   | `#FFFFFF` | `#2A0E0A` |
| Tomate foncée (survol, texte sur tomate claire)   | `--tomate-fonce` | `#B92F25` | `#FF9A8E` |
| Tomate claire (entrée de menu active, avatar)     | `--tomate-clair` | `#FDE8E5` | `#3A1E1C` |
| Papier Petit-déj                                  | `--beurre`       | `#FFF1C2` | `#3B3320` |
| Papier Midi                                       | `--menthe`       | `#D7F5E3` | `#1D3A2B` |
| Papier Collation                                  | `--peche`        | `#FFE0D1` | `#40291F` |
| Papier Soir                                       | `--ciel`         | `#DCE9FF` | `#1E2C46` |
| Protéines, anneau                                 | `--prot`         | `#3B6FE0` | `#7FA8F5` |
| Protéines, texte                                  | `--prot-texte`   | `#2F5FD0` | `#9DBFF7` |
| Glucides, anneau                                  | `--gluc`         | `#F5B82E` | `#F5C35A` |
| Lipides, anneau                                   | `--lip`          | `#EC5B8C` | `#F27FA6` |
| Erreur                                            | `--erreur`       | `#A3211A` | `#FF8F86` |
| Fond d'erreur                                     | `--erreur-fond`  | `#FBEAEA` | `#3B1C25` |
| Contour de focus                                  | `--focus`        | `#1C2230` | `#ECEFF5` |

- **Créneaux** : un créneau créé par la personne (au-delà des 4 de base) prend les papiers dans l'ordre beurre, menthe, pêche, ciel, puis recommence. La couleur n'est jamais seule : le nom du créneau est toujours écrit.
- **Tomate et erreur** sont toutes deux rouges : une erreur s'accompagne toujours de l'icône `circle-alert`, d'un fond `--erreur-fond` et d'un message écrit.
- `--prot`, `--gluc` et `--lip` ne servent qu'aux formes (anneau, pastilles de légende). Les grammes sont toujours écrits à côté.
- **Succès** : message écrit à côté de l'élément (voir § 8), jamais la couleur seule.

**Contrastes vérifiés** (WCAG AA : 4,5:1 pour le texte), clair / sombre :

- Encre sur surface / sur fond : 15,9 / 14,7 — 13,8 / 15,7.
- Encre pâle sur surface / sur fond : 6,1 / 5,6 — 6,8 / 7,8.
- Encre sur les papiers : 12,7 à 14,1 — 10,8 à 12,1.
- Encre pâle sur les papiers : 4,9 à 5,4 — 5,3 à 6,0.
- Texte sur bouton tomate (normal / survol) : 4,7 / 6,0 — 7,1 / 8,8.
- Tomate sur surface (liens soulignés) : 4,7 — 6,2. Tomate foncée sur tomate claire : 5,1 — 6,0.
- Protéines (texte) sur surface : 5,7 — 8,5. Erreur sur surface / sur fond d'erreur : 7,5 / 6,5 — 7,2 / 6,9.

## 3. Typographie

Une seule police : **Rubik** (Google Fonts, licence libre), ronde et lisible, pour tout, textes longs compris.

Chargement : `https://fonts.googleapis.com/css2?family=Rubik:wght@400;500;600;700;800&display=swap`

| Usage                                   | Graisse | Taille téléphone         | Taille PC | Détail                  |
| --------------------------------------- | ------- | ------------------------ | --------- | ----------------------- |
| Titre d'écran (Recettes, Planning)      | 800     | 32 px                    | 32 px     | interlettrage −0,025 em |
| Grand titre de connexion (« Mijote »)   | 800     | 32 px                    | 84 px     | interlettrage −0,035 em |
| Chiffre au centre d'un anneau           | 800     | taille de l'anneau ÷ 4,4 | idem      | « kcal » dessous en 500 |
| Calories d'une carte recette            | 800     | 22 px                    | 22 px     | « kcal/part » 12 px 500 |
| Titre de ticket, de panneau, de section | 700     | 16–17 px                 | 17 px     |                         |
| Nom d'un plat, titre de carte           | 600–700 | 15 px                    | 15 px     |                         |
| Texte courant, étapes, aide             | 400     | 16 px                    | 15–16 px  | interlignage 1,5        |
| Détails (parts, durée, « ligne libre ») | 400–500 | 12,5–14 px               | 13–14 px  | `--encre-2`             |

- Les champs de saisie gardent 16 px minimum, sinon l'iPhone zoome sur la page.
- Chiffres : toujours `font-variant-numeric: tabular-nums`, pour que les colonnes s'alignent.
- Séparateur des milliers : Rubik n'a pas l'espace fine insécable ; remplacer celle que donne `toLocaleString("fr-FR")` par une espace insécable normale (` `).

## 4. Espacements et grille

- **Échelle** : 4, 6, 8, 10, 12, 14, 16, 18, 22, 26, 32 px.
- **Téléphone** : marge latérale de 16 px ; 12 px entre deux cartes ; 10 px entre deux tickets.
- **PC** : menu latéral de 248 px ; contenu avec 30 à 34 px de marge ; colonnes et panneaux décrits au § 9.
- **Zones à toucher** : 44 × 44 px minimum.

## 5. Formes

- **Cartes, panneaux, résumé du jour** : surface blanche, coins de 20 à 26 px, sans ombre ni bordure.
- **Boutons et champs** : coins de 14 px, 50 px de haut.
- **Puces** : coins de 10 px, 36 px de haut.
- **Ticket** : coins droits, bords haut et bas dentelés (demi-cercles de 5 px tous les 14 px, faits avec un `mask`), sans ombre.
- **Talon** : petit ticket dentelé sur les côtés gauche et droit (demi-cercles de 3 px), coins de 3 px, tourné de −6°.
- **Anneau** : rond, épaisseur 11 % du diamètre, 3,5 % de jour entre l'anneau et le centre.
- **Bordures** : 1,5 px `--trait` pour les champs, puces et boutons secondaires ; tirets 1,5 px `#C5CBD8` pour « à compléter » et les jours vides ; pointillés 2 px de l'encre à 25 % entre le nom d'un plat et ses calories.
- **Ombres** : aucune, sauf le bouton flottant (`0 6px 16px -6px` encre à 35 %).

## 6. Composants

### Anneau des macros (composant clé)

- `conic-gradient` protéines, glucides, lipides, dans le sens des aiguilles d'une montre depuis le haut ; la part de chaque couleur est la **part des calories** (protéines × 4, glucides × 4, lipides × 9, sur le total). Le trou est fait par un masque radial.
- **Centre** : la photo du plat en rond ; sans photo, les calories (« 380 » puis « kcal ») ; pour un jour ou un logo, rien.
- **Calories inconnues** : anneau en tirets gris, « ? » au centre.
- **Tailles** : 30 px (logo), 34 px (jour, téléphone), 40 px (jour, PC), 54 px (bandeau du jour), 96 px (carte recette téléphone), 110 px (carte recette PC), 120 à 190 px (connexion), 128 px (résumé du jour, téléphone), 140 px (résumé du jour, PC), 150 px (fiche recette).
- **Légende** à côté des grands anneaux : pastille de 10 px aux coins de 3 px, nom, grammes en gras (« Protéines 90 g »).

### Ticket de créneau

- Fond : le papier du créneau. Marge intérieure 14 × 16 px.
- **En-tête** : nom du créneau (16 px, 700) à gauche, total du créneau (« 560 kcal », 14 px, `--encre-2`) à droite.
- **Ligne de plat** : vignette 38 px aux coins de 12 px (photo, ou icône `utensils` pour une recette sans photo, `apple` pour une ligne libre, sur blanc à 75 %), nom (15 px, 600) avec dessous « 1 part, 42 g prot. » ou « ligne libre », pointillés qui remplissent l'espace, calories à droite en gras.
- Nom trop long : coupé par « … » sur téléphone ; sur deux lignes quand les tickets sont en grille (PC).
- Les tickets d'une journée se suivent dans l'ordre des créneaux, 10 à 12 px d'écart.

### Carte recette (recettes et idées)

- Surface blanche, coins 22 px, contenu centré : anneau avec photo (calories au centre s'il n'y a pas de photo), titre (15 px, 700, sur deux lignes au plus), calories par part (22 px, 800), protéines en `--prot-texte`, puis durée et parts avec icônes 14 px. Une recette partagée ajoute « de Léa ».
- Calories inconnues : anneau en tirets et « kcal à compléter » dans un cadre en tirets.
- **Talon** : quand la recette est au planning de la semaine affichée, un talon sur le papier du créneau (« Mer. midi ») est posé en haut à gauche, au-dessus de l'anneau. S'il y en a plusieurs, on montre le plus proche dans le temps.
- Survol : la carte monte de 2 px.

### Bandeau du jour (en tête des recettes)

- Surface blanche, coins 20 px : petit anneau du jour (54 px), « Aujourd'hui, mercredi » et « 1 518 kcal prévues ».
- PC : à droite, une pastille par créneau sur son papier (nom et calories), puis le lien « Voir le planning ». Téléphone : un chevron, tout le bandeau mène au planning.

### Filtres des recettes

- **Contenu** : « De qui » (Toutes, Les miennes, Partagées avec moi), « Calories par part » (Moins de 300, 300 à 500, Plus de 500, À compléter), « Temps » (Moins de 20 min, Moins de 45 min). Chaque choix est une case à cocher carrée de 20 px (cochée : fond `--encre`, coche blanche) avec le nombre de recettes à droite. Lien « Tout effacer » en haut.
- **PC** : colonne de 230 px dans un panneau blanc, à gauche des cartes.
- **Téléphone** : sous la recherche, une puce « Filtres » avec une pastille tomate qui donne le nombre de filtres actifs, puis une puce noire par filtre actif avec une croix pour l'enlever. Toucher « Filtres » ouvre une feuille qui monte du bas avec la même liste et un bouton « Voir les 9 recettes ».

### Boutons

| Type                          | Style                                                                                         | États                                                                                                                                                         |
| ----------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Principal                     | Fond `--tomate`, texte `--sur-tomate`, 16 px 700, coins 14 px, 50 px                          | survol : `--tomate-fonce` ; focus : contour 3 px `--focus` décalé de 2 px ; désactivé : opacité 0,5 ; chargement : petite roue et libellé « Enregistrement… » |
| Secondaire                    | Fond `--surface`, bord 1,5 px `--trait`                                                       | survol : bord `--encre-2`                                                                                                                                     |
| Danger                        | Fond `--erreur`, texte blanc                                                                  | nomme toujours l'action (« Supprimer le créneau et ses 3 plats »)                                                                                             |
| Flottant « Nouvelle recette » | Bouton principal de 54 px, coins 18 px, en bas à droite au-dessus des onglets, avec son ombre | la liste garde 110 px de vide en bas pour que rien ne reste caché dessous                                                                                     |
| Lien                          | Texte `--encre` 600, souligné 2 px `--tomate`                                                 | « Voir le planning », « Mot de passe oublié ? », « Tout effacer »                                                                                             |

Libellés : un verbe qui dit ce qui se passe (« Mettre au planning », « Ajouter une ligne », « Copier ce jour »), sans flèche. « Ajouter une ligne » reste un bouton principal plein, sur téléphone comme sur PC (choix du 2026-11-22).

### Champs

- Fond `--fond` (blanc sur une surface grise), bord 1,5 px `--trait`, coins 14 px, 50 px de haut, icône à gauche en `--encre-2`, valeur 16 px.
- Libellé au-dessus, 14 px 600.
- Focus : bord `--encre`, fond blanc.
- Erreur : bord et texte `--erreur`, fond `--erreur-fond`, icône `circle-alert` ; message dessous en 13 px, qui dit quoi faire.
- Aide sous le champ : 13–14 px, `--encre-2`.

### Puces

Coins 10 px, bord 1,5 px `--trait`, 14 px 600. Active : fond `--encre`, texte blanc. Défilement horizontal sur téléphone.

### Fiche recette (pas encore dans l'aperçu)

En haut, l'anneau de 150 px avec la photo, le titre, la légende des macros et les calories par part. Puis le sélecteur de parts (− / chiffre / +, boutons secondaires de 44 px), les ingrédients dans un ticket blanc (une ligne par ingrédient avec pointillés et grammes, case à cocher de 20 px ; cochée : texte barré en `--encre-2`), le total par part et les protéines, puis les étapes numérotées (numéro en tomate, texte 16 px). En bas : « Mettre au planning ». Sur PC : photo et anneau à gauche, ingrédients et étapes à droite, le tout centré.

### Planning

- **Résumé du jour** : surface blanche, coins 26 px : grand anneau avec le total au centre, légende des macros à côté (sur PC, la date au-dessus de la légende).
- **Téléphone** : titre, barre des 7 jours (jour, petit anneau ou rond en tirets si vide, date ; jour choisi sur surface blanche avec un contour tomate de 2 px), résumé du jour, les tickets de créneau les uns sous les autres, bouton « Ajouter une ligne ».
- **PC** : voir § 9.

### Navigation

- **Téléphone** : barre d'onglets en bas sur `--surface`, trait `--trait` au-dessus ; 5 entrées (Recettes, Idées, Planning, Courses, Aliments) avec icône et libellé 11 px ; l'onglet actif est en `--tomate`. Profil et admin : avatar rond en haut à droite des écrans principaux (fond `--tomate-clair`, initiale en `--tomate-fonce`).
- **PC** : menu latéral de 248 px sur `--surface`, trait à droite ; logo : petit anneau de 30 px et « Mijote » (24 px, 800) ; entrée active en fond `--tomate-clair`, texte `--tomate-fonce`, coins 14 px ; « Mon compte » à la fin ; mention des sources des données en bas.

### Connexion

- **Téléphone** : anneau de 92 px avec une photo et « Mijote » à côté avec sa phrase ; trois petits tickets de couleur en biais, côte à côte (Petit-déj, Midi, Soir : créneau, plat, calories) ; puis le formulaire dans une carte blanche.
- **Grand écran** : un bloc centré de 1 120 px max : à gauche « Mijote » en 84 px, la phrase, trois assiettes (anneaux de 190, 150 et 120 px) qui portent chacune un petit ticket de couleur en biais, à cheval sur le bas de l'anneau, et la mention des données ; à droite le formulaire (460 px).
- Les plats montrés sont des exemples fixes, ils ne viennent pas des données de la personne.

### Fenêtres

- Téléphone : une feuille blanche qui monte du bas (coins hauts de 26 px, poignée grise de 44 × 5 px), sur fond assombri (encre à 45 %).
- PC : carte blanche centrée de 480 px, coins 26 px, sur fond assombri.

### États vides, chargement, confirmation

- **Vide** : un anneau en tirets, une phrase qui dit quoi faire (« Aucune recette pour l'instant : ajoute la première ou importe-la depuis un lien. »), puis un bouton.
- **Jour vide du planning** : rond en tirets à la place de l'anneau, « rien de prévu ».
- **Chargement** : formes grises aux emplacements des cartes ou des lignes (anneau gris, barres grises), sans animation de lueur.
- **Confirmation** : message court sous l'élément (« Recette enregistrée »), avec l'icône `check`.
- **Données** : « Données : Ciqual (ANSES), Open Food Facts, USDA FoodData Central » dans le menu PC, sur la connexion et sur la page Aliments.

## 7. Icônes et illustrations

- **Icônes** : [Lucide](https://lucide.dev) (licence ISC, gratuite, sans crédit obligatoire) via `lucide-react`. Trait de 1,9, extrémités arrondies, 20 px (14 px dans les cartes, 16 px dans les puces). Utilisées : `search`, `plus`, `minus`, `clock`, `users`, `chevron-left`, `chevron-right`, `book-open`, `lightbulb`, `calendar`, `shopping-cart`, `apple`, `utensils`, `scan-barcode`, `check`, `x`, `sliders-horizontal`, `share-2`, `circle-alert`, `pencil`, `copy`, `mail`, `lock`, `eye`.
- **Illustrations** : aucune. Les anneaux et les tickets tiennent ce rôle.
- **Photos** : celles des personnes, réduites automatiquement, toujours dans un anneau rond (ou une vignette de 38 px dans les tickets). Les photos de `design/variantes/img/` servent seulement aux aperçus (crédits dans `CREDITS.md`).

## 8. Animations

| Quoi                                   | Comment                                                                        | Durée, courbe                      |
| -------------------------------------- | ------------------------------------------------------------------------------ | ---------------------------------- |
| Changer de jour dans le planning       | les anneaux se remplissent depuis le haut, les tickets arrivent en fondu       | 300 ms, `cubic-bezier(.2,.8,.2,1)` |
| Enregistrer (recette, idée, plat)      | le message de confirmation apparaît en fondu avec sa coche                     | 200 ms                             |
| Changer le nombre de parts             | les grammes et le total se mettent à jour, le chiffre glisse de −6 px en fondu | 200 ms                             |
| Cocher un ingrédient ou un filtre      | la coche apparaît, le texte de l'ingrédient se barre                           | 150 ms                             |
| Ajouter ou retirer une ligne de ticket | la ligne glisse en place                                                       | AutoAnimate, 200 ms                |
| Ouvrir une fenêtre ou les filtres      | la feuille monte depuis le bas (téléphone) ou la carte apparaît en fondu (PC)  | 250 ms                             |
| Survol d'une carte                     | la carte monte de 2 px                                                         | 150 ms                             |

- **`prefers-reduced-motion: reduce`** : toutes les durées passent à 0.
- **Bibliothèque** : [AutoAnimate](https://auto-animate.formkit.com) (`@formkit/auto-animate`, licence MIT) pour les listes. Le reste en CSS et avec `element.animate()`.

## 9. Responsive

**Règle générale sur grand écran (choix de l'utilisatrice, 2026-11-25)** : le contenu est centré, avec une largeur maximale, et des marges égales à gauche et à droite. Pour que la page paraisse pleine, on ajoute des colonnes utiles (filtres, semaine, actions) plutôt que d'étirer les cartes. Cette règle remplace celle du 2026-11-20 (« le contenu part toujours de la gauche »).

| Largeur                     | Disposition                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Moins de 768 px (téléphone) | Onglets en bas ; un écran à la fois ; cartes en 2 colonnes ; filtres dans une feuille du bas ; planning en résumé du jour puis tickets de créneau ; fenêtres en feuille du bas                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 768 à 1023 px (tablette)    | Comme le téléphone, cartes en 3 colonnes, contenu centré sur 720 px max                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 1024 px et plus (PC)        | Menu latéral de 248 px, puis contenu centré (1 200 px max). **Recettes et idées** : colonne de filtres (230 px) à gauche, bandeau du jour au-dessus des cartes, cartes en 4 colonnes (3 sous 1 280 px) ; toucher une carte ouvre la fiche complète (choix du 2026-11-21). **Planning** : trois colonnes `250 px / reste / 250 px` : la semaine (un jour par ligne : anneau de 40 px, jour, nombre de créneaux, total ; jour choisi avec un contour tomate), le jour au centre (résumé, puis les tickets de créneau en grille de 2), les actions à droite (« Ajouter une ligne », « Copier ce jour », graphique en barres de la semaine, jour choisi en tomate, moyenne écrite dessous). **Connexion** : bloc centré décrit au § 6. Fenêtres centrées |

**Exception : formulaire de recette (choix de l'utilisatrice, 2026-11-21).** Trois colonnes quand la zone de contenu fait au moins 1 080 px (mesurée à côté du menu, par « container query », pas sur l'écran) : ingrédients à gauche, étapes au milieu (un champ par étape, « Étape 1 », « Étape 2 »…, bouton « Ajouter une étape »), infos de la recette à droite (360 px : photo, titre, parts, temps, lien, étiquettes, visibilité, calories). De 720 à 1 079 px : infos au-dessus sur deux colonnes, puis ingrédients et étapes côte à côte. Téléphone : une colonne, infos puis ingrédients puis étapes. Les blocs sont des cartes blanches (plus des tickets), avec les couleurs, la police et les formes de ce fichier.

Application installable (PWA) : couleur du thème `#F4F6FA` (clair) et `#13161D` (sombre), écran de démarrage sur `--fond`. Icône : le petit anneau du logo sur fond blanc.
