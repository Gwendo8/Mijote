# DESIGN.md — Mijote

Fiche de style de l'application. Les maquettes Figma (lien dans `PROJET.md`) font foi pour chaque écran, en téléphone et en PC : le `front` les reproduit fidèlement et compare son rendu à la maquette, écran par écran, avant de rendre la main. Ce fichier donne les couleurs, polices, composants et règles qui servent partout, y compris aux écrans sans maquette. Si une maquette et ce fichier se contredisent, le front le signale.

Aperçus de référence, à ouvrir dans un navigateur :

- `design/variantes/8b-l-addition.html` : le concept, téléphone et PC ;
- `design/variantes/9-planning-pc-addition.html` : le planning PC (version **A** retenue) ;
- `design/variantes/10-police-textes.html` : la police des textes longs (Atkinson Hyperlegible Next retenue).

Concept retenu par l'utilisatrice le 2026-11-20 : **« L'addition »**. Il remplace la variante « Mi-figue mi-raisin », jugée trop proche des designs faits par IA.

## 1. Intention

Compter les calories, c'est faire l'addition. Mijote emprunte ses objets au commerce de bouche : le **ticket de caisse** pour tout ce qui s'additionne (planning du jour, fiche recette, totaux), l'**étiquette de marché** en papier kraft pour les recettes et les idées, le **tampon encreur** pour l'anneau des macros. Le tout posé sur un comptoir gris clair.

- **Mots-clés** : ticket, comptoir, marché, lisible, chiffres alignés, un peu d'humour.
- **Signatures à préserver** :
  - le ticket aux bords dentelés, avec ses pointillés et son total souligné deux fois ;
  - l'étiquette kraft en forme de flèche, avec son trou ;
  - le tampon rond posé de travers, dont l'anneau montre la part des protéines, glucides et lipides.
- **À ne jamais faire** :
  - des cartes blanches arrondies génériques, des pilules partout, des ombres douces grises ;
  - des dégradés décoratifs, des effets verre, des emojis à la place des icônes ;
  - une troisième police ;
  - des photos envahissantes : la photo reste petite, dans le tampon.
- **Majuscules** : réservées aux mentions imprimées des tickets (« TOTAL », « PETIT-DÉJ », « PAR PART », nom de la recette en en-tête de ticket). Jamais pour les boutons, les menus ni les titres d'écran.

## 2. Couleurs

Variables CSS sur `:root`. Le mode suit le réglage de l'appareil (`prefers-color-scheme`), avec un réglage manuel « Automatique / Clair / Sombre » dans le profil, qui pose `data-theme` sur `<html>`.

| Rôle                                                              | Variable          | Clair     | Sombre    |
| ----------------------------------------------------------------- | ----------------- | --------- | --------- |
| Comptoir (fond de page)                                           | `--comptoir`      | `#E7E4DC` | `#141513` |
| Papier (tickets, champs, barre d'onglets)                         | `--papier`        | `#FFFFFF` | `#1F211E` |
| Encre (texte, bordures, boutons noirs)                            | `--encre`         | `#1B1D1A` | `#ECEAE3` |
| Encre pâle (texte secondaire)                                     | `--encre-2`       | `#5E605A` | `#A5A59C` |
| Pointillés et séparateurs                                         | `--pointilles`    | `#B8B6AE` | `#4A4C47` |
| Vert (bouton principal, jour choisi, tampon, totaux mis en avant) | `--vert`          | `#24634B` | `#7FD1A8` |
| Texte posé sur le vert                                            | `--sur-vert`      | `#FFFFFF` | `#0C2018` |
| Vert clair (ligne choisie, jour surligné)                         | `--vert-clair`    | `#E3EEE8` | `#1C3328` |
| Kraft (étiquettes de recettes avec photo)                         | `--kraft`         | `#D9C3A0` | `#4A3E2C` |
| Texte secondaire sur kraft                                        | `--kraft-texte-2` | `#4F4230` | `#D9C7A8` |
| Protéines, anneau                                                 | `--prot`          | `#2F5FA8` | `#7FA8EA` |
| Protéines, texte                                                  | `--prot-texte`    | `#244A85` | `#9DBFF2` |
| Glucides, anneau                                                  | `--gluc`          | `#D99A1E` | `#F0C063` |
| Lipides, anneau                                                   | `--lip`           | `#C9527F` | `#F08BB0` |
| Erreur                                                            | `--erreur`        | `#B3261E` | `#FF8F86` |
| Fond d'erreur                                                     | `--erreur-fond`   | `#FBEAEA` | `#3B1C25` |
| Contour de focus                                                  | `--focus`         | `#24634B` | `#7FD1A8` |

- **Le texte des tickets est toujours en `--encre`.** Les calories ne sont pas colorées : elles se distinguent par leur place (alignées à droite) et leur graisse. Le vert est réservé à l'action et à ce qui est choisi.
- **Succès** : un tampon vert « ENREGISTRÉ » se pose sur l'élément (voir § 8), avec un message écrit à côté. Jamais la couleur seule.
- Les couleurs `--prot`, `--gluc` et `--lip` ne servent qu'aux formes (anneau, pastilles de légende). Les grammes sont toujours écrits à côté.

**Contrastes vérifiés** (WCAG AA : 4,5:1 pour le texte) :

| Paire                                       | Clair       | Sombre      |
| ------------------------------------------- | ----------- | ----------- |
| Encre sur papier / sur comptoir             | 17,0 / 13,4 | 13,5 / 15,2 |
| Encre pâle sur papier / sur comptoir        | 6,4 / 5,0   | 6,5 / 7,4   |
| Vert sur papier, texte sur bouton vert      | 7,1 / 7,1   | 9,0 / 9,4   |
| Encre sur kraft, texte secondaire sur kraft | 9,9 / 5,7   | 8,4 / 6,3   |
| Protéines (texte) sur papier / sur kraft    | 8,8 / 5,1   | 8,6 / 6,7   |
| Vert sur vert clair                         | 6,0         | 7,5         |
| Erreur sur papier                           | 6,5         | 7,4         |

## 3. Typographie

Deux polices Google Fonts, gratuites, avec une règle fixe **par type d'élément** (jamais deux polices dans un même bloc de texte) :

| Type d'élément                                                                                       | Police                                      |
| ---------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| Titres, chiffres, tickets, étiquettes, boutons, menus, puces, libellés de champs, valeurs saisies    | **Martian Mono** (machine à écrire)         |
| Textes longs : étapes d'une recette, description, phrases d'aide et d'erreur, messages d'explication | **Atkinson Hyperlegible Next** (lisibilité) |

Chargement : `https://fonts.googleapis.com/css2?family=Martian+Mono:wdth,wght@75..112.5,300..800&family=Atkinson+Hyperlegible+Next:wght@400;600&display=swap`

Martian Mono a un axe de largeur (`wdth`), utilisé comme une hiérarchie :

| Usage                                      | Largeur `wdth` | Graisse | Taille téléphone       | Taille PC |
| ------------------------------------------ | -------------- | ------- | ---------------------- | --------- |
| Titre d'écran (Recettes, Planning)         | 112,5 (large)  | 800     | 30 px                  | 34 px     |
| En-tête de ticket (nom de recette, MIJOTE) | 112,5          | 800     | 18 px                  | 20 px     |
| Gros chiffre (total, prix d'étiquette)     | 75 (étroit)    | 800     | 30 à 40 px             | 40 px     |
| Lignes de ticket, texte d'interface        | 87,5 (normal)  | 400–700 | 13 px                  | 13–14 px  |
| Mentions de ticket en capitales            | 87,5           | 800     | 11 px, espacement +6 % | 11 px     |

Atkinson Hyperlegible Next : 16 px, interlignage 1,55, graisse 400 (600 pour une mise en avant). Les champs de saisie gardent 16 px minimum, sinon l'iPhone zoome sur la page.

Chiffres : toujours `font-variant-numeric: tabular-nums`, pour que les colonnes s'alignent.

## 4. Espacements et grille

- **Échelle** : 4, 6, 8, 12, 14, 16, 18, 22, 26, 32 px.
- **Téléphone** : marge latérale de 16 px ; 14 px entre deux étiquettes ; 12 à 14 px de marge intérieure dans un ticket.
- **PC** : menu latéral de 220 px ; contenu avec 26 à 30 px de marge ; panneau de fiche de 380 px.
- **Largeur max** du contenu : 1440 px.
- **Zones à toucher** : 44 × 44 px minimum.

## 5. Formes

- **Tickets** : bords haut et bas dentelés (demi-cercles de 5 px tous les 12 px, faits avec un `mask`), coins droits, légère ombre portée de 2 px.
- **Étiquettes** : forme de flèche vers la gauche (`clip-path`), trou rond de 9 px, coins droits côté pointe, arrondis de 22 px côté droit.
- **Boutons, champs, puces** : rectangles aux coins presque droits (4 px). Pas de pilules.
- **Tampon** : rond, posé à −8°.
- **Bordures** : 1,5 px `--encre` pour les champs, les puces et les boutons à contour ; pointillés `--pointilles` (2 px) à l'intérieur des tickets ; tirets 1,5 px pour séparer les parties d'un ticket.
- **Ombres** : aucune, sauf la légère ombre des tickets et celle du bouton flottant.

## 6. Composants

### Ticket (composant clé)

- **En-tête** centré : mention en Martian Mono large 800 (« MIJOTE », nom de la recette), puis une ou deux lignes en encre pâle (date, parts, durée).
- **Ligne** : nom à gauche, pointillés qui remplissent l'espace, valeur alignée à droite en gras. Nom trop long : coupé par « … » sur une ligne.
- **Mention de partie** (« PETIT-DÉJ », « ÉTAPES ») : capitales 11 px en encre pâle, suivies de pointillés.
- **Texte libre** dans un ticket : en italique.
- **Total** : « TOTAL » à gauche, nombre à droite en Martian Mono étroit 800, **souligné deux fois** (`border-bottom: 5px double`). Ligne « dont protéines » dessous.
- **Code-barres** : décoratif, en bas des tickets complets (pas dans les tickets compacts du PC).

### Étiquette de marché (recettes et idées)

- Fond `--kraft` quand la recette a une photo, `--papier` sinon.
- En haut : le tampon (56 px) à gauche, le « prix » à droite (calories par part en Martian Mono étroit 30 px, « kcal/part » dessous, protéines en `--prot-texte`).
- En bas : titre (13 px, 800), puis durée et parts.
- Calories inconnues : « kcal ? » dans un cadre en pointillés, à la place du prix.
- Grille de 2 colonnes sur téléphone, 3 sur PC.

### Tampon et anneau des macros

- Anneau extérieur : `conic-gradient` protéines, glucides, lipides, dans le sens des aiguilles d'une montre depuis le haut ; la part de chaque couleur est la **part des calories** (protéines × 4, glucides × 4, lipides × 9, sur le total). Épaisseur : 41 % du rayon (masque radial à 58 %).
- Centre : la photo du plat en rond (74 % du diamètre) ; sans photo, un rond blanc cerclé de vert avec les calories écrites en vert, façon tampon (comme les maquettes).
- Calories inconnues : anneau en tirets gris, « ? » au centre.
- Posé à −8°. Tailles : 150 px (fiche), 56 px (étiquette).
- Légende sous le tampon de la fiche : pastilles de 9 px et grammes (« Prot. 17 g »).

### Boutons

| Type                          | Style                                                                                | États                                                                                                                                                   |
| ----------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Principal                     | Fond `--vert`, texte `--sur-vert`, Martian Mono 800 13 px, coins 4 px, 48 px de haut | survol : vert plus foncé de 8 % ; focus : contour 3 px `--focus` décalé de 2 px ; désactivé : opacité 0,5 ; chargement : « Impression… » et petite roue |
| Noir                          | Fond `--encre`, texte `--papier`                                                     | mêmes états                                                                                                                                             |
| Contour                       | Fond transparent, bord 1,5 px `--encre`                                              | survol : fond `--papier`                                                                                                                                |
| Danger                        | Fond `--erreur`, texte blanc                                                         | nomme toujours l'action (« Supprimer le créneau et ses 3 plats »)                                                                                       |
| Flottant « Nouvelle recette » | Bouton vert, en bas à droite au-dessus des onglets, ombre `0 6px 0 -2px` à 20 %      | la liste garde 96 px de vide en bas pour que rien ne reste caché dessous                                                                                |

Libellés : un verbe qui dit ce qui se passe (« Mettre au planning », « Ajouter une ligne »), sans flèche.

### Champs

- Fond `--papier`, bord 1,5 px `--encre`, coins 4 px, 46 à 50 px de haut. Valeur en Martian Mono 16 px (13 px sur PC).
- Libellé au-dessus en capitales Martian Mono 12 px 800.
- Focus : bord `--focus` 2 px.
- Erreur : bord et texte `--erreur`, fond `--erreur-fond` ; message dessous en Atkinson Hyperlegible Next 13 px, qui dit quoi faire.
- Aide sous le champ : Atkinson Hyperlegible Next 13 px, `--encre-2`.

### Puces (filtres et étiquettes)

Rectangles à coins de 4 px, bord 1,5 px `--encre`, Martian Mono 12 px 700. Active : fond `--encre`, texte `--papier`. Défilement horizontal sur téléphone.

### Fiche recette

Un grand ticket : en-tête (nom, parts, durée), description (Atkinson), tampon et légende, sélecteur de parts (« PARTS » à gauche, − / chiffre / + à droite, boutons contour 36 px), ingrédients en lignes avec case à cocher carrée de 16 px (cochée : texte barré, encre pâle), total « PAR PART », « dont protéines », partie « ÉTAPES » (numéros en Martian Mono vert, texte en Atkinson 16 px), code-barres. Sous le ticket : « Mettre au planning ».

### Planning

- **Téléphone** : barre des 7 jours (cases à coins de 4 px, jour choisi en `--encre`), puis le **ticket du jour** (« MIJOTE », date, une partie par créneau, une ligne par plat, total souligné deux fois, protéines), puis le bouton « Ajouter une ligne ».
- **PC (version A)** : colonne de 7 mini-tickets à gauche (jour et total ; jour choisi avec un trait vert à gauche et fond `--vert-clair`) ; ticket du jour en grand au centre (520 px max) ; colonne d'actions à droite (« Ajouter une ligne », « Copier ce jour », moyenne de la semaine). À revoir dans l'appli si l'usage le demande (décision du 2026-11-20).

### Navigation

- **Téléphone** : barre d'onglets en bas sur `--papier`, séparée du contenu par un trait en tirets ; 5 entrées (Recettes, Idées, Planning, Courses, Aliments) ; l'onglet actif a un fond `--comptoir` et un texte `--encre`. Profil et admin : bouton en haut à droite des écrans principaux.
- **PC** : menu latéral sur `--papier`, séparé par un trait en tirets ; logo « Mijote » en Martian Mono large ; entrée active en fond `--encre`, texte `--papier` ; mention des sources des données en bas.

### Fenêtres

- Téléphone : un ticket qui monte du bas (bord haut dentelé), sur fond assombri (encre à 40 %).
- PC : ticket centré de 480 px, sur fond assombri.

### États vides, chargement, confirmation

- **Vide** : un ticket vide avec « RIEN À ADDITIONNER » et une phrase qui dit quoi faire, puis un bouton.
- **Chargement** : le ticket « s'imprime » (voir § 8) avec des lignes grises à la place du texte.
- **Confirmation** : tampon vert « ENREGISTRÉ » posé de travers sur le ticket, avec un message écrit.
- **Données** : « Données : Ciqual (ANSES), Open Food Facts » dans le menu PC et sur la page Aliments.

## 7. Icônes et illustrations

- **Icônes** : [Lucide](https://lucide.dev) (licence ISC, gratuite, sans crédit obligatoire) via `lucide-react`. Trait de 1,8, extrémités arrondies, 20 px. Utilisées : `search`, `plus`, `minus`, `clock`, `chevron-left`, `book`, `lightbulb`, `calendar`, `shopping-cart`, `apple`, `scan-barcode`, `check`, `share-2`, `circle-alert`, `pencil`, `utensils`, `copy`.
- **Illustrations** : aucune. Les tickets, étiquettes et tampons tiennent ce rôle.
- **Photos** : celles des personnes, réduites automatiquement, toujours dans un tampon rond. Les photos de `design/variantes/img/` servent seulement aux aperçus (crédits dans `CREDITS.md`).

## 8. Animations

| Quoi                                   | Comment                                                                        | Durée, courbe                       |
| -------------------------------------- | ------------------------------------------------------------------------------ | ----------------------------------- |
| Changer de jour dans le planning       | le nouveau ticket « s'imprime » : il apparaît de haut en bas (`clip-path`)     | 300 ms, `cubic-bezier(.2,.8,.2,1)`  |
| Enregistrer (recette, idée, plat)      | un tampon « ENREGISTRÉ » se pose : grossit de 1,3 à 1 et tourne jusqu'à −8°    | 220 ms, `cubic-bezier(.3,1.6,.5,1)` |
| Changer le nombre de parts             | les grammes et le total se mettent à jour, le chiffre glisse de −6 px en fondu | 200 ms                              |
| Cocher un ingrédient                   | la coche apparaît, le texte se barre                                           | 150 ms                              |
| Ajouter ou retirer une ligne de ticket | la ligne glisse en place                                                       | AutoAnimate, 200 ms                 |
| Ouvrir une fenêtre                     | le ticket monte depuis le bas (téléphone) ou apparaît en fondu (PC)            | 250 ms                              |

- **`prefers-reduced-motion: reduce`** : toutes les durées passent à 0.
- **Bibliothèque** : [AutoAnimate](https://auto-animate.formkit.com) (`@formkit/auto-animate`, licence MIT) pour les listes. Le reste en CSS et avec `element.animate()`.

## 9. Responsive

| Largeur                     | Disposition                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Moins de 768 px (téléphone) | Onglets en bas ; un écran à la fois ; étiquettes en 2 colonnes ; planning en ticket du jour ; fenêtres en ticket qui monte du bas                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 768 à 1023 px (tablette)    | Comme le téléphone, étiquettes en 3 colonnes, contenu centré sur 720 px max                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 1024 px et plus (PC)        | Menu latéral. **Recettes et idées** : étiquettes en 3 colonnes ; toucher une étiquette ouvre la fiche complète (plus de panneau, choix de l'utilisatrice 2026-11-21). **Planning** : version A (mini-tickets de la semaine, ticket du jour au centre, actions à droite). **Formulaires et autres écrans** : disposition de leur maquette PC (ex. profil en deux colonnes, connexion avec vitrine à gauche et ticket à droite). Le contenu des pages part toujours de la gauche, à côté du menu, même quand une maquette le centre (choix de l'utilisatrice, 2026-11-20). Fenêtres centrées |

**Exception : formulaire de recette (choix de l'utilisatrice, 2026-11-21, absent des maquettes Figma).** Trois colonnes de tickets quand la zone de contenu fait au moins 1080 px (mesurée à côté du menu, par « container query », pas sur l'écran) : ingrédients à gauche, étapes au milieu (un champ par étape, « Étape 1 », « Étape 2 »…, bouton « + Ajouter une étape »), infos de la recette à droite (360 px : photo, titre, parts, temps, lien, étiquettes, visibilité, ticket des calories). De 720 à 1079 px (PC à 1280 px) : infos au-dessus sur deux colonnes, puis ingrédients et étapes côte à côte. Téléphone : une colonne, infos puis ingrédients puis étapes. Même style « L'addition » (tickets, polices, couleurs).

Application installable (PWA) : couleur du thème `#1B1D1A` (clair) et `#141513` (sombre), écran de démarrage sur `--comptoir`. L'icône sera un petit ticket avec un tampon, à dessiner avec les maquettes.
