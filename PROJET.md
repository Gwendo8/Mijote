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

### Socle client (fondations du front, bloc 1)

Statut : fait (bloc 1 sur 7 : thème, cadre téléphone/PC, composants communs, session, écrans de comptes). Reste : bloc 2 Aliments, 3 Recettes, 4 Idées, 5 Planning, 6 Admin, 7 PWA et finitions. Écrans `/recettes`, `/idees`, `/planning`, `/aliments`, `/admin` : pages « Bientôt » (`pages/placeholder/PlaceholderPage.jsx`) à remplacer.

- Thème « L'addition » : `client/src/index.css` (variables par rôle, `@theme inline`, polices `@fontsource-variable`, tickets dentelés, animations, `prefers-reduced-motion`), `client/index.html` (applique le thème avant l'affichage)
- Appels API : `services/api.js` (`apiFetch({ json })`, FormData sans en-tête imposé, évènement sur 401), `services/auth/authService.js`, `services/me/meService.js`
- Session : `components/auth/SessionProvider.jsx` (GET /auth/me au chargement, revérifie sur 401), `hooks/auth/{sessionContext,useSession}.js`, barrières `components/auth/{RequireAuth,RedirectIfAuth}.jsx`
- Hooks génériques : `hooks/common/useAction.js` (envoi : en cours, erreur, erreurs par champ), `hooks/common/useLoad.js` (chargement avec clé) ; hooks de comptes : `hooks/auth/*`, `hooks/me/*`, `hooks/theme/useTheme.js`
- Composants communs : `components/ui/` (Bouton, Champ, Ticket et ses parties, Tampon, Etiquette, Puce, Fenetre, DialogueConfirmation, Chargement, EtatVide, Confirmation, MessageErreur) ; cadre : `components/layout/{Layout,AuthLayout,EnTetePage,TabBar,SideMenu,navigation}` ; décor des tickets : `CodeBarres`, `TamponOk`, `ReglesMotDePasse` ; `hooks/layout/useIsDesktop.js`
- Écrans : `pages/auth/{Login,Register,ForgotPassword,ResetPassword}Page.jsx` (`/connexion`, `/inscription?token=`, `/mot-de-passe-oublie`, `/mot-de-passe?token=`), `pages/profile/{ProfilePage,InfosForm,PasswordForm,DeleteAccount}.jsx` (`/profil`), `pages/not-found/NotFoundPage.jsx`
- Règles de saisie (mêmes messages que l'API) : `schemas/auth.js` ; outils : `utils/{validate,theme,macros}.js`
- Tests : à côté de chaque fichier, plus `src/test/helpers.jsx` (`mockApi`, `renderApp`) ; pages testées en intégration avec les vraies routes
- Piège : `apiFetch` ne met plus `Content-Type` de lui-même : passer `json` (objet) ou `body` (FormData, pour les photos).
- Piège : un 401 ne ramène pas toujours à la connexion (« mauvais mot de passe » est aussi un 401) : `SessionProvider` redemande `/auth/me` et ne change que si lui répond 401.
- Piège : `getErrorMessage` renvoie maintenant le motif du back pour un 401 (« Mot de passe incorrect »).
- Piège : les barres de navigation (onglets et menu PC) sont toutes deux dans la page, l'une cachée par CSS : leurs `aria-label` doivent rester différents.
- Fidélité Figma (2026-11-20, correction du bloc 1) : chaque écran est comparé à sa maquette en téléphone (390) et PC (1440). Connexion et comptes : titre « Mijote » + avatar ou bouton retour sur téléphone, vitrine à gauche et ticket à droite sur PC. Profil : sur téléphone ticket récapitulatif + fenêtres « Modifier » et « Mot de passe » ; sur PC formulaires dans le ticket, deux colonnes (le choix se fait avec `useIsDesktop`, pas seulement en CSS). Chaque écran connecté pose son titre avec `EnTetePage` (bouton du compte à droite sur téléphone, rien sur PC).
- Prénom et nom séparés (2026-11-20) : `schemas/auth.js` (`firstName`, `lastName`), formulaires d'inscription et de profil à deux champs. Affichage : `utils/names.js` (`fullName` « Prénom Nom » sans espace en trop, `firstNameOf`, `displayNameFor(person, currentUserId)` : soi par le prénom, les autres en nom complet), à réutiliser pour partages et planning. Si `lastName` est vide, le profil invite à le compléter.
- Validité des liens : `utils/dates.js` (`formatJourMois` ; `formatJusqua` pour le lien « mot de passe oublié » : heure de fin) ; inscription « Lien valable jusqu'au … » (`expiresAt` de l'invitation) ; nouveau mot de passe : `services/auth/authService.js` `getResetLink` + `hooks/auth/useResetLink.js` (e-mail, validité ; lien invalide = état d'erreur dès l'ouverture).
- Version de l'appli (2026-11-20) : `client/vite.config.js` (`buildVersion` : commit court + date et heure de construction, heure de Paris, « dev » sans git) injecte `import.meta.env.VITE_APP_VERSION`, affichée en bas de `pages/profile/ProfilePage.jsx`. Pourquoi : vérifier qu'un téléphone a bien reçu la dernière mise à jour.
- Photos d'exemple : `client/src/assets/photos/*.webp` (480 px, crédits dans `CREDITS.md` à côté), utilisées par `AuthLayout` (vitrine PC, avatar de la connexion).
- À savoir : onglet « Courses » caché (téléphone et menu PC) tant que la liste de courses n'existe pas : le remettre dans `components/layout/navigation.js` et ajouter la route dans `router.jsx`. Thème clair par défaut, réglage gardé sur l'appareil (`localStorage`). Règles du mot de passe : celles de l'API (8 caractères, un chiffre, un caractère spécial), pas celles de la maquette.

### Base de données (schéma, migrations, modèles)

Statut : faite (bases `mijote_test` et `mijote` créées et migrées)

- Schéma de référence : `server/src/database/schema.dbml` (diagramme exiDraw « mijote — schéma BDD »)
- Migrations : `server/src/database/migrations/20261119150001-create-users.cjs` à `…150014-create-planning-shares.cjs` (14 tables), puis `20261120140000-split-user-display-name.cjs` (prénom + nom à la place de `display_name`), `20261120125704-enable-unaccent.cjs`, `20261120125705-create-sessions.cjs` (15e table), `20261120125705-add-last-known-values-to-meal-plan-entries.cjs`
- Modèles et relations : `server/src/models/*.js`, relations dans `server/src/models/index.js` (dont `Session.js`)
- Tests : `server/tests/models.test.js` (suppressions, unicités, sessions, `unaccent`)
- Tables de la liste de courses (`shopping_lists`, `shopping_list_items`) : dessinées dans le schéma, créées quand on attaquera la fonctionnalité.

### Design (style, DESIGN.md, maquettes Figma)

Statut : faite (concept « L'addition » validé le 2026-11-20 : `DESIGN.md` et 50 maquettes Figma)

- Maquettes Figma : https://www.figma.com/design/RpJhECL8dR4BK4ZlR25lWe (pages Composants, Téléphone, PC ; une section par domaine)

- Fiche de style : `DESIGN.md` (racine) : couleurs, polices, composants et règles communes. Pour chaque écran, la maquette Figma (téléphone et PC) fait foi ; le front compare son rendu à la maquette avant de rendre la main. Exceptions écrites dans `DESIGN.md` : centre du tampon sans photo blanc cerclé de vert (§ Tampon) ; sur PC, contenu des pages calé à gauche à côté du menu, même si la maquette le centre (§ 9 Responsive, choix de l'utilisatrice du 2026-11-20) ; sur PC, toucher une étiquette de recette ou d'idée ouvre la fiche complète, sans panneau à droite (§ 9, 2026-11-21) ; formulaire de recette en trois colonnes, absent des maquettes (§ 9 « Exception : formulaire de recette », 2026-11-21).
- Inspirations : `design/inspirations/` (8 captures numérotées, planche `selection.png`, liens dans `sources.md`)
- Variantes (pages d'aperçu à ouvrir dans le navigateur) : `design/variantes/1-assiette-de-nuit.html`, `2-carnet-net.html`, `3-mi-figue-mi-raisin.html`, `4-figue-au-carnet.html` (base 3 + touches de la 2, avec deux écrans PC), `5-vert-foret.html` et `6-orange-brule.html` (variante 3 dans les deux palettes comparées ; la verte est retenue), `7a-titres-sport.html`, `7b-une-police.html`, `7c-blanc-citron.html` (pistes pour rendre le design moins « fait par IA » : police des titres, formes, couleur), `8a-cocotte-emaillee.html`, `8b-l-addition.html`, `8c-dossard.html` (3 concepts d'identité complets, téléphone et PC), `9-planning-pc-addition.html` (4 dispositions du planning PC pour « L'addition »), `10-police-textes.html` (3 polices possibles pour les textes longs) ; photos libres et crédits dans `design/variantes/img/` (`CREDITS.md`)

### Contrat de l'API

Statut : faite (validé par l'utilisatrice le 2026-11-20)

- `API.md` (racine) : routes, droits, formats et erreurs de toute la V1, sauf la liste de courses

### Comptes (invitations, connexion, mot de passe oublié, admin, suppression)

Statut : back fait (blocs 1 et 2 : connexion, sessions, inscription, mot de passe oublié, `/api/me`, admin : comptes, invitations, réglages, étiquettes, recherche de personnes) ; front à faire

- Contrat : `API.md` (sections 1 à 3)
- Admin : `server/src/routes/admin.routes.js` (tout `/api/admin`, réservé aux admins) ; `GET /api/tags` : `tags.routes.js` ; `GET /api/users/search` : `users.routes.js` ; logique : `server/src/services/{admin-users,invitations,tags,settings,users}.service.js` ; accès base : `repositories/{tags}.repository.js` et les fonctions ajoutées à `users`, `invitations`, `settings`
- Routes : `server/src/routes/{auth,me,settings}.routes.js` ; schémas Zod : `server/src/schemas/{auth,me}.schema.js`
- Logique : `server/src/services/{auth,me,session,emails}.service.js` / `emails.js` ; accès base : `server/src/repositories/{users,sessions,invitations,password-reset-tokens,settings,meal-slots}.repository.js`
- Socle : `server/src/middlewares/{auth,rateLimits}.js` (cookie `mijote_session`, session en base), `server/src/utils/{password,tokens}.js` (scrypt, jetons), `server/src/integrations/mailer.js` (Brevo ou terminal)
- Lien « mot de passe oublié » : `GET /api/auth/reset-password/:token` (e-mail + date de fin) ; invitation : `GET /api/auth/invitations/:token` renvoie aussi `expiresAt`
- Premier compte admin : `server/scripts/create-admin.js` (`npm run admin:create -- email "Prénom" "Nom"`)
- Tests : `server/tests/integration/{auth,me,admin,admin-email}.test.js`, `server/tests/unit/password-rules.test.js`, outils `server/tests/helpers.js`

### Aliments (Ciqual, Open Food Facts, scan, aliments perso, corrections admin)

Statut : back fait (bloc 2) ; front fait (bloc 2 du front, sans la liste `/admin/corrections`, prévue au bloc 6). Table Ciqual 2025 importée dans `mijote` (3 484 aliments, vérifié le 2026-11-20).

- Contrat : `API.md` (section 4) ; routes : `server/src/routes/foods.routes.js` (+ corrections dans `admin.routes.js`) ; schémas : `schemas/{foods,common}.schema.js`
- Logique : `server/src/services/foods.service.js` (valeurs effectives = correction si elle existe, archivage d'un aliment perso utilisé) ; accès base : `repositories/foods.repository.js` (recherche sans accents, `utils/search.js`) ; Open Food Facts : `server/src/integrations/openfoodfacts.js` (limite `offLimiter` dans `middlewares/rateLimits.js`, `OFF_USER_AGENT` dans `.env`)
- Import Ciqual : `server/src/services/ciqual-import.service.js` + `server/scripts/ciqual-import.js` (`npm run ciqual:import -- dossier`)
- Tests : `server/tests/integration/{foods,ciqual-import}.test.js`, `server/tests/unit/ciqual-parse.test.js`, extrait de table dans `server/tests/fixtures/ciqual.js`
- Piège : la table Ciqual de l'ANSES est en **plusieurs fichiers XML** (`alim`, `alim_grp`, `compo` de 70 Mo), pas un seul : le script prend un dossier. Règle des valeurs : « traces » = 0, « < x » = x, « - » = inconnu. Environ 3 500 aliments, 440 Mo de mémoire pendant l'import (quelques secondes).
- Piège : Open Food Facts répond parfois 503 quand il est surchargé (limites globales, indépendantes de notre compteur) : ce n'est pas un bug de Mijote, l'appli affiche « surchargé, réessaie dans un instant ».
- Piège : un produit Open Food Facts se rafraîchit après 90 jours, ses valeurs d'origine sont réécrites mais la correction admin (autre table) reste. La limite de 20 requêtes par minute et par personne (`offLimiter`) compte aussi les codes-barres déjà en cache.
- Limite commune à tout le serveur (2026-11-20) : `server/src/integrations/openfoodfacts.js` (`takeBudget`) refuse en 429 au-delà de 10 recherches et 15 lectures de produit par minute, car Open Food Facts compte par adresse IP (sa documentation) et peut bannir l'adresse du serveur, partagée par tous les comptes. Seuls les vrais appels comptent (un produit en cache ne passe pas par là). Si Open Food Facts répond 429 ou 502 et que le produit est en cache, `getByBarcode` (`foods.service.js`) renvoie la version gardée. Tests : `resetOffBudget` appelé par `resetAll` (`server/tests/helpers.js`), deux tests dans `foods.test.js`.
- Piège (bloc 3) : un aliment perso lu par un autre compte n'est visible que si une recette visible l'utilise (`foodsRepository.isUsedInRecipeVisibleTo`) ; la copie d'une recette partagée doit copier aussi ces aliments.
- Front : `pages/foods/{AlimentsPage,AlimentPage,AlimentFormPage}.jsx` (`/aliments` avec `?q=` et `?f=`, `/aliments/:id`, `/aliments/nouveau`, `/aliments/:id/modifier` ; sur PC le formulaire est une fenêtre posée sur la liste, sur téléphone un écran) ; `components/foods/` (recherche, puces, `ListeAliments` ticket téléphone + tableau PC, fiche, `CalculPortion`, `FormulaireAliment`, `FenetreScan` + `ZoneCamera` + `ProduitTrouve`, `FenetreCorrection` admin, `PasLeBonAliment`, **`SelecteurAliment`** réutilisable : recherche, choix, grammes, `onAdd({ food, grams })`) ; `services/foods/foodsService.js` ; `hooks/foods/{useFoodSearch,useFood,useFoodActions,useCodeScanner}.js`, `hooks/common/useDebounced.js` ; `schemas/foods.js` ; `utils/foods.js` ; `components/layout/BoutonRetour.jsx`
- Front, scan : `BarcodeDetector` si le navigateur l'a, sinon `@zxing/browser` (+ `@zxing/library`, chargé à l'ouverture seulement, morceau séparé du build) ; saisie du numéro toujours possible ; 404, 429 et 502 expliqués à l'écran. « Utiliser cet aliment » ouvre la fiche (le bloc 3 pourra passer un autre `onUse`).
- Front, décisions : « Corriger » (admin, aliment commun) n'envoie que les valeurs différentes de l'origine ; la valeur d'origine reste affichée. Supprimer un aliment perso utilisé : le dialogue et le message d'après expliquent qu'il est « rangé » (archivé). Recherche : 2 lettres minimum, 300 ms de délai, 50 résultats au plus ; « Chercher aussi chez Open Food Facts » (bouton ajouté, absent des maquettes) ajoute les produits à la liste.
- Code-barres sur un aliment perso (2026-11-20) : `barcode` accepté à la création et à la modification ; migration `20261120160000-add-user-food-barcode-unique.cjs` (index unique partiel `(owner_id, barcode)` pour les aliments perso non archivés, à côté de `foods_barcode_off_unique`) ; le scan cherche d'abord mes aliments perso (`foodsRepository.findMineByBarcode`).
- Front : le centre du tampon sans photo est un rond blanc cerclé de vert avec les calories en vert (maquettes et `DESIGN.md` § Tampon), rendu par `Tampon.jsx`. L'API accepte maintenant `barcode` à la création et à la modification (2026-11-20) : le champ « Code-barres » de la maquette peut être affiché.

### Recettes (création, import par lien, photo, parts, étiquettes, calories, recherche, partage)

Statut : back fait (bloc 3, avec les idées de plats) ; front fait (bloc 3 du front, sans « Mettre au planning », prévu au bloc 5, ni les écrans d'idées, bloc 4)

- Front : `pages/recipes/{RecettesPage,RecettePage,RecetteFormPage}.jsx` (`/recettes` avec `?q=&t=&s=&cal=&prot=`, `/recettes/importer`, `/recettes/nouveau`, `/recettes/:id`, `/recettes/:id/modifier`) ; `components/recipes/` (`CarteRecette`, `ListeRecettes`, `FiltresRecettes`, `FicheRecette` + `SelecteurParts`, `LigneIngredient`, `LegendeMacros`, `TotalParPart`, `EtapesRecette`, `ChampsEtapes` (formulaire), `BarreActionsRecette`, `SupprimerRecette`, `FenetrePartage` + `ChoixVisibilite`, `FormulaireImport` + `FenetreImport`, `FormulaireRecette` + `ChampPhoto`, `ChoixEtiquettes`, `LignesIngredients`) ; `components/ui/ChampTexteLong.jsx` ; `services/{recipes/recipesService,tags/tagsService,users/usersService}.js` ; `hooks/recipes/{useRecipes,useRecipe,useRecipeActions,useTags,useUserSearch}.js` ; `schemas/recipes.js` ; `utils/recipes.js` (durées, parts, calcul en direct, conversion de photo)
- Réutilisable pour les idées (bloc 4) : `FormulaireRecette kind="idea"`, `useRecipes({ kind: 'idea' })`, `FicheRecette`, `CarteRecette`, `LignesIngredients idee`, `ChoixVisibilite`, `FenetrePartage`.
- Front, décisions : toucher une étiquette ouvre la fiche (`/recettes/:id`) sur PC comme sur téléphone (plus de panneau ni de `?r=`, choix de l'utilisatrice du 2026-11-21) ; régler les parts fait suivre les grammes et le nombre au début du texte d'un ingrédient (« 4 œufs » → « 8 œufs »), les calories PAR PART ne bougent pas ; partage = `PUT` de la recette entière (l'API remplace tout) ; la photo est envoyée après l'enregistrement (`PUT /photo`), convertie en JPEG par canvas si elle n'est pas JPEG/PNG/WebP ; l'aperçu d'un import charge l'image du site d'origine dans le navigateur.
- Anneau des étiquettes de la liste : protéines, glucides et lipides, lus dans `nutrition.perServing` que la liste de l'API renvoie depuis le 2026-11-21 (`nutritionShort`, `recipes.service.js`) ; `Etiquette.jsx` se rabat sur la part des protéines seule si ce détail est à 0 (recette sans aliment relié, calories saisies à la main).
- Formulaire (choix de l'utilisatrice, 2026-11-21) : trois colonnes (ingrédients, étapes, infos) quand la zone de contenu fait 1080 px ou plus, deux colonnes de 720 à 1079 px (infos au-dessus), une sur téléphone (infos, ingrédients, étapes) ; mesuré par container query (`@container`, `@min-[720px]`, `@min-[1080px]`) dans `FormulaireRecette.jsx`. Étapes : un champ par étape (`ChampsEtapes.jsx`, hauteur qui suit le texte, pas de retour à la ligne : remplacé par une espace) ; l'API garde `instructions` en texte, une étape par ligne (`stepsFromText` / `stepsToText` dans `utils/recipes.js`, étapes vides ignorées). Ordre de tabulation = ordre du téléphone (infos d'abord), donc différent de l'ordre visuel en trois colonnes.
- Piège (2026-11-21) : `Fenetre` était posée dans le formulaire de la page ; « Relier » envoyait en vrai navigateur le petit formulaire de l'aliment en natif (`?grams=120`, page rechargée), ce que jsdom ne montre pas. `Fenetre` passe maintenant par un portail (`createPortal` dans `body`).
- Piège (2026-11-21) : `SelecteurAliment` s'ouvre dans le formulaire d'une recette (« Relier » un ingrédient écrit à la main) ; React fait remonter l'envoi de son petit formulaire jusqu'à celui de la recette, qui s'enverrait en entier. `add` appelle donc `event.stopPropagation()`. Test : « relie un ingrédient écrit à la main à un aliment, sans envoyer la recette » dans `client/src/pages/recipes/RecettesPages.test.jsx`.
- Front, écarts avec les maquettes : bouton « Filtres » (de qui sont les recettes, calories, protéines) ajouté ; description facultative ajoutée au formulaire ; le bouton « Mettre au planning » manque (bloc 5).

- Contrat : `API.md` (section 5 + « Précisions apportées au codage (bloc 3) ») ; routes : `server/src/routes/recipes.routes.js` ; schémas : `schemas/recipes.schema.js`
- Logique : `server/src/services/recipes.service.js` (droits 404/403, liste et filtres, copie, photos, suppression de compte) ; calcul : `utils/nutrition.js` (pur, testé sans base) ; accès base : `repositories/recipes.repository.js` (visibilité, recherche `unaccent` dans titre et ingrédients, étiquettes « toutes »)
- Photos : `services/recipe-photos.service.js` (sharp : 1200 px, WebP), `middlewares/photoUpload.js` (multer, champ `photo`, 10 Mo), `storage/index.js` (dossier `UPLOAD_DIR`, défaut `server/uploads/`, ignoré par git) ; servies par `GET /api/recipes/:id/photo` après contrôle des droits ; compteur de requêtes à part (`photoLimiter`)
- Import par lien : `services/recipe-import.service.js`, `utils/recipe-schema-org.js` (JSON-LD, `node-html-parser`), `integrations/safeFetch.js` (anti-SSRF : IP vérifiée après DNS et à chaque redirection, 10 s, 2 Mo)
- Tests : `server/tests/integration/{recipes,recipes-photos,recipes-import}.test.js`, `tests/unit/{nutrition,recipe-schema-org,safe-fetch}.test.js` (DNS et `fetch` imités, images générées par le test)
- Piège : calories et protéines jamais stockées (sauf correction à la main) ; filtrer ou trier par calories/protéines charge toutes les recettes qui correspondent aux autres filtres et calcule en JavaScript (très bien jusqu'à quelques milliers de recettes ; à revoir au-delà).
- Piège : suppression de compte : `deletingPhotosOf` (recipes.service) relève les chemins des photos, supprime le compte, puis efface les fichiers (si la base échoue, aucune photo n'est perdue).
- Piège : `safeFetch` vérifie l'IP avant la connexion mais `fetch` résout le nom une seconde fois (« DNS rebinding » théorique) : risque jugé faible pour une appli perso.
- Piège : les photos HEIC d'iPhone ne sont pas toujours lisibles par `sharp` : le front doit envoyer JPEG/PNG/WebP.
- Piège : `inTransaction(work)` donne la transaction à `work` ; il faut la passer aux requêtes (`{ transaction }`). Sans cela la transaction ne protège rien (vu et corrigé dans `cacheProducts`, `foods.service.js`, le 2026-11-20).

### Idées de plats

Statut : back fait avec les recettes (même table `recipes`, `kind = idea`, mêmes routes `/api/recipes`) ; front à faire

- Une idée exige au moins un aliment avec ses grammes ; elle ignore étapes et temps (mises à `null`).

### Planning de la semaine

Statut : back fait (bloc 4) ; front à faire

- Contrat : `API.md` (section 6 + « Précisions apportées au codage (bloc 4) ») ; routes : `server/src/routes/planning.routes.js` ; schémas : `schemas/planning.schema.js`
- Logique : `services/planning.service.js` (semaine, entrées, déplacements, dernières calories connues), `services/meal-slots.service.js` (créneaux), `services/planning-shares.service.js` (partages) ; accès base : `repositories/{meal-slots,meal-plan-entries,planning-shares}.repository.js` ; outils purs : `utils/dates.js` (lundi, jours), `utils/positions.js` (renumérotation)
- `services/recipes.service.js` exporte maintenant `canSee`, `findVisible`, `nutritionOf`, `photoUrl` pour le planning
- Tests : `server/tests/integration/planning.test.js`, `tests/unit/dates.test.js`
- Piège : dans une semaine, les dernières valeurs connues ne s'écrivent que quand la propriétaire lit et que la valeur a changé (écriture `silent`, sans bouger `updated_at`). Un lecteur ne modifie jamais rien.
- Piège : une recette supprimée met `recipe_id` à NULL ; on la reconnaît à ses dernières valeurs connues (sans calories saisies). Un texte libre n'a jamais de dernières valeurs.

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
- 2026-11-20 — Session : une ligne par appareil dans `sessions` (empreinte du jeton seulement), cookie httpOnly valable 6 mois et prolongé à chaque visite, comme Platine pour tout ce qui se voit. « Se déconnecter » ne ferme que l'appareil en cours, « Me déconnecter partout » ferme tout. Pourquoi : Platine déconnecte tous les appareils d'un coup (son « option B », notée dans `platine/SUITE.md`, à reprendre depuis Mijote une fois testée).
- 2026-11-20 — Aliment perso utilisé dans des recettes : archivé (`foods.archived_at`) au lieu d'être supprimé ; les recettes gardent leurs calories. Exception à « suppression réelle partout ». Pourquoi : supprimer un aliment présent dans des centaines de recettes les aurait toutes remises « à compléter ».
- 2026-11-20 — Planning : chaque case retient les dernières calories et protéines connues par part de sa recette, et les garde si la recette n'est plus visible (partage retiré, recette supprimée), comptées dans le total du jour. Exception à « calories jamais stockées », limitée au planning. Proposition « Copier chez moi pour la garder ? » quand on place une recette d'une autre personne.
- 2026-11-20 — Recherche sans accents par l'extension `unaccent`, comme Platine, sans colonne normalisée en plus ; elle couvre les titres et le texte des ingrédients.
- 2026-11-20 — Contrat : invitations par l'admin seule, plusieurs admins possibles (au moins un toujours), partage par recherche du nom (sans e-mail), corrections admin sur Ciqual et Open Food Facts, « public » = visible par les comptes connectés, mot de passe comme Platine (8 caractères, un chiffre, un caractère spécial).
- 2026-11-19 — Lecture seule de l'utilisatrice sur les bases : Claude crée et migre seulement `mijote_test` ; la base de dev `mijote` est créée et migrée par l'utilisatrice.
- 2026-11-20 — Prénom et nom séparés comme Platine (`first_name` + `last_name`, 100 caractères, obligatoires) à la place de `display_name`. Les comptes existants gardent leur ancien nom en prénom et un nom vide. Affichage côté appli : les autres en « Prénom Nom », soi-même par le prénom.

## Pièges

- Figma : Martian Mono n'y existe qu'en largeur normale (pas de version étroite ni large). Dans les maquettes, les gros chiffres sont resserrés par l'espacement des lettres ; dans l'appli, utiliser l'axe `wdth` comme décrit dans `DESIGN.md`.

- Figma, offre Starter : 3 pages maximum par fichier (Composants, Téléphone, PC). Les outils de lecture du serveur Figma (captures, métadonnées) peuvent être limités ; les captures se font depuis `use_figma` (`node.screenshot()`).

- Scan du code-barres et installation PWA : ne marchent qu'en HTTPS (ou sur localhost en développement).
- Unicité avec valeurs vides (`planning_shares`) : PostgreSQL considère deux NULL comme différents ; l'index unique utilise `NULLS NOT DISTINCT` (PostgreSQL 15+), écrit en SQL dans la migration.
- `password_hash` et `token_hash` ne doivent jamais sortir dans une réponse de l'API.
- Suppression d'un compte (par lui-même ou par l'admin) : `usersRepository.remove` dans `me.service.js` et `admin-users.service.js` ; le bloc 3 devra y effacer les photos des recettes avant.
- Sessions : un cookie = une ligne de `sessions` (empreinte SHA-256 du jeton). Valable 6 mois, prolongée au plus une fois par jour. Supprimer un compte supprime ses sessions par cascade de la base, mais pas ses fichiers : le bloc 3 (photos) devra effacer les photos des recettes du compte avant `usersRepository.remove`.
- « Mot de passe oublié » répond `204` même si l'e-mail ne part pas (échec noté dans le journal du serveur) : on ne doit pas pouvoir deviner qui a un compte. Connexion : même délai et même message pour une adresse inconnue.
- Derrière Caddy, `trust proxy` est réglé à 1 en production (sinon les limites de requêtes compteraient tout le monde ensemble). Si Tailscale Funnel ajoute un saut de plus, vérifier que la limite voit bien l'adresse du visiteur.
- Les aliments perso d'une personne doivent rester lisibles par ceux qui voient une recette partagée qui les utilise.
- exiDraw refuse de rendre l'aperçu d'un schéma de 16 tables (« Rendu trop long ») : vérifier la mise en page en ouvrant exiDraw. Compte gratuit plein (3 documents sur 3) : mettre à jour le diagramme existant.
- E-mails Brevo envoyés avec une adresse Gmail : risque d'arriver en indésirables tant qu'il n'y a pas de nom de domaine à soi.
- 2026-11-20 — Un aliment perso peut porter un code-barres : retrouvé au scan avant Open Food Facts, unique par personne (aliments non archivés), jamais trouvé par un autre compte.

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
- 2026-11-20 — Back lancé à la demande de l'utilisatrice : brouillon du contrat `API.md` écrit par l'agent back (session par cookie en base, photos servies avec contrôle des droits, import par lien en brouillon, script d'import Ciqual). 10 questions en attente de réponse.
- 2026-11-20 — `API.md` mis à jour avec les réponses de l'utilisatrice : une session par appareil (« Me déconnecter partout » en plus, le reste comme Platine), aliment perso utilisé archivé au lieu d'être supprimé, dernières calories connues gardées dans les cases du planning, recherche sans accents par colonnes normalisées. Question Q11 (recherche dans les ingrédients) et changements de base en attente de validation.
- 2026-11-20 — Contrat de l'API validé. Base complétée (migrations testées sur `mijote_test`) : table `sessions`, extension `unaccent`, dernières calories et protéines connues par part dans `meal_plan_entries`. Recherche dans les titres et les ingrédients. Migrations à lancer par l'utilisatrice sur `mijote`.
- 2026-11-20 — `API.md` ajouté au dépôt dans sa version validée : recherche par `unaccent` sans colonne normalisée, section « Ce que le reste du projet doit préparer » à jour (migrations `sessions`, `unaccent` et dernières calories connues faites ; dépendances, variables `.env` et commandes à lancer sur `mijote` listées).
- 2026-11-20 — Back, bloc 2 fait : admin (comptes, invitations, réglages, étiquettes), recherche de personnes, aliments (recherche sans accents, perso, archivage, corrections admin), Open Food Facts (cache, limite, 502) et import Ciqual (testé sur la vraie table 2025 : 3 484 aliments, relançable). 156 tests verts.
- 2026-11-20 — Back, bloc 3 fait : recettes et idées de plats (CRUD, visibilité privée / partagée / publique, calories et protéines recalculées, recherche et filtres sans accents, copie avec aliments perso et photo), photos (sharp, WebP, servies avec contrôle des droits), import par lien (schema.org, protection SSRF), suppression de compte qui efface les photos. 219 tests verts.
- 2026-11-20 — Back, bloc 4 fait : planning (créneaux masquables et ajoutables, semaine datée avec totaux par jour et par semaine, entrées recette / idée / texte libre, déplacements, dernières calories connues, partage en lecture seule). 252 tests verts.
- 2026-11-20 — Back terminé (4 blocs : socle et comptes, admin et aliments, recettes et idées, planning), 252 tests. Reste la liste de courses (plus tard). Prochaine étape : front.
- 2026-11-20 — Plan du front validé (7 blocs). Front, bloc 1 fait : thème, polices, cadre téléphone/PC, composants communs, session, connexion, inscription, mots de passe, profil, 404. 93 tests verts.
- 2026-11-20 — Front, correction du bloc 1 : écrans des comptes, profil, onglets et menu PC refaits d'après les maquettes Figma (téléphone et PC). 95 tests verts.
- 2026-11-20 — `DESIGN.md` : les maquettes Figma font foi pour chaque écran (téléphone et PC), le front compare son rendu à la maquette avant de rendre la main ; règle « formulaires centrés sur PC » remplacée par la disposition des maquettes PC. Demande de l'utilisatrice, après un bloc 1 qui ne suivait pas les maquettes.
- 2026-11-20 — Back : prénom et nom séparés (migration `20261120140000`, modèle, inscription, profil, admin, recherche, `owner` / `sharedWith` / `invitedBy`, script `admin:create`) ; `expiresAt` sur le lien d'invitation ; nouvelle route `GET /api/auth/reset-password/:token`. 257 tests verts, migration testée (haut, bas, haut) sur `mijote_test` ; `mijote` à migrer par l'utilisatrice.
- 2026-11-20 — Front, retouches du bloc 1 à la demande de l'utilisatrice : phrase d'aide sous le champ Nom retirée (absente de la maquette) ; le lien « mot de passe oublié » (1 heure) affiche son heure de fin (`formatJusqua` dans `client/src/utils/dates.js`).
- 2026-11-20 — Front, retouches téléphone du bloc 1 demandées par l'utilisatrice : ticket de connexion centré verticalement (`AuthLayout`), libellé « e-mail » complet et valeur longue à la ligne (`TicketLigne` dans `Ticket.jsx`), puces du thème centrées et compactes (`Puce`, `ProfilePage`), boutons à 44 px et texte 12 px sur téléphone (48 px sur PC, `Bouton`), « Mot de passe oublié ? » à 36 px (`LoginPage`). PC inchangé.
- 2026-11-20 — Profil téléphone : l'adresse e-mail passe sur sa propre ligne, alignée à gauche sous son libellé (`TicketLigne` avec `valeurDessous`), à la demande de l'utilisatrice.
- 2026-11-20 — Front, bloc 2 fait : recherche d'aliments, fiche avec calcul de portion, aliment perso (création, modification, suppression avec archivage expliqué), scan du code-barres, correction admin, sélecteur d'aliment réutilisable. Comparé aux maquettes Figma en téléphone et PC. 159 tests verts.
- 2026-11-20 — Aliments, retouches demandées par l'utilisatrice : colonnes du tableau PC à largeur fixe (`ListeAliments.jsx`), car les noms longs de Ciqual écrasaient les chiffres ; « Chercher aussi chez Open Food Facts » en lien discret sous Scanner / Créer sur téléphone (`PasLeBonAliment.jsx`) ; `DESIGN.md` : centre du tampon sans photo blanc cerclé de vert, comme les maquettes. Table Ciqual 2025 récupérée sur recherche.data.gouv.fr (doi:10.57745/RDMHWY, site de l'ANSES en panne), import testé sur `mijote_test` (3 484 aliments).
- 2026-11-20 — Back : code-barres sur les aliments perso (création, modification, scan prioritaire, 409 en doublon, migration d'index partiel). 265 tests verts.
- 2026-11-20 — Front, code-barres d'un aliment perso : champ « Code-barres (facultatif) » avec bouton de scan à côté, comme la maquette (`FormulaireAliment.jsx`, `schemas/foods.js`) ; un scan sans résultat ouvre le formulaire avec le code déjà rempli (`/aliments/nouveau?code=`, `AlimentFormPage.jsx`) ; `FenetreScan` accepte `onCode` (lecture du numéro seulement).
- 2026-11-20 — Aliments, noms longs (demande de l'utilisatrice) : sur PC, une ligne avec « … » et bulle du nom complet au survol (`components/ui/TexteTronque.jsx`, bulle posée sur `document.body` car le ticket coupe ce qui dépasse), espace élargi avant « Source » (`ListeAliments.jsx`) ; sur téléphone, essai de deux lignes au plus (`AlimentLigne.jsx`, pas dans le sélecteur) : en attente de l'avis de l'utilisatrice, car deux aliments Ciqual deviennent identiques.
- 2026-11-20 — Aliments : nom complet gardé sur téléphone (deux lignes rendaient deux aliments Ciqual identiques), choix de l'utilisatrice ; fiche d'un aliment sur PC calée à gauche au lieu d'être centrée (`AlimentPage.jsx`) ; règle ajoutée à `DESIGN.md` : sur PC, le contenu des pages part de la gauche, même si la maquette le centre.
- 2026-11-20 — Version de l'appli (commit + heure de construction, `client/vite.config.js`) affichée en bas du profil (`ProfilePage.jsx`), pour vérifier qu'un téléphone a bien la dernière mise à jour. Produit Open Food Facts en cache renvoyé aussi quand Open Food Facts répond 429 (`getByBarcode`).
- 2026-11-20 — Open Food Facts : limite commune à tout le serveur, alignée sur leur documentation (10 recherches et 15 lectures de produit par minute et par IP, risque de bannissement au-delà) dans `server/src/integrations/openfoodfacts.js` (`takeBudget`, `resetOffBudget` pour les tests) ; l'ancienne limite (20 par minute et par personne) pouvait dépasser la leur dès deux personnes. Choix de l'utilisatrice : recherche Open Food Facts lancée toute seule quand la base trouve moins de 3 résultats (option B).
- 2026-11-20 — Front, recherche Open Food Facts automatique (option B) : `client/src/pages/foods/AlimentsPage.jsx` la lance une fois par recherche, 800 ms après la fin de la frappe, si la base trouve moins de 3 aliments (`AUTO_OFF_SOUS`) ; le lien reste disponible. Tests ajoutés.
- 2026-11-20 — Open Food Facts : l'erreur « ne répond pas » vue par l'utilisatrice venait d'Open Food Facts (réponse 503, leurs limites globales quand ils sont surchargés ; vérifié par un appel direct : 503 puis 200 cinq secondes plus tard) ; message dédié « surchargé, réessaie dans un instant ». Limite atteinte : le serveur renvoie `Retry-After` (`openfoodfacts.js`, `errorHandler.js`), le client le lit (`ApiError.retryAfter`, `services/api.js`), `useOffSearch` bloque la recherche avec un compte à rebours (bouton grisé « réessaie dans 42 s », `libelleOff` dans `utils/foods.js`) et la recherche automatique ne part pas pendant l'attente.
- 2026-11-20 — `DESIGN.md` mis à jour : tampon sans photo décrit comme dans les maquettes (rond blanc cerclé de vert, calories en vert) ; tableau Responsive, ligne PC : contenu des pages toujours calé à gauche à côté du menu (choix de l'utilisatrice). Carte de PROJET.md alignée (sections Design et Aliments).
- 2026-11-20 — Front, bloc 3 Recettes : liste, fiche (parts, droits), formulaire (ingrédients reliés ou en texte libre, photo, étiquettes, correction à la main), import par lien (cas TikTok), partage ; 209 tests, lint et build verts. Le message d'erreur 422 de l'API est maintenant lu (`utils/errorMessage.js`).
- 2026-11-21 — Front : formulaire de recette en trois colonnes avec une étape par champ, fiche ouverte directement au clic sur PC (panneau supprimé), `Fenetre` en portail (correction de « Relier » dans un vrai navigateur) ; lint, 220 tests et build verts.
- 2026-11-21 — Anneau complet sur les étiquettes de la liste des recettes, comme la maquette (option A choisie par l'utilisatrice) : `GET /api/recipes` renvoie `nutrition.perServing` (protéines, glucides, lipides), `API.md` § 5 mis à jour, `Etiquette.jsx` s'en sert. Tests : `server/tests/integration/recipes.test.js`, `client/src/components/ui/Etiquette.test.jsx`.
- 2026-11-21 — Recettes, correction : relier un ingrédient écrit à la main à un aliment envoyait toute la recette (l'envoi du `SelecteurAliment` remontait jusqu'au formulaire de la recette). `SelecteurAliment.jsx` arrête cette remontée ; test ajouté dans `RecettesPages.test.jsx`.
- 2026-11-21 — `DESIGN.md` § 9 Responsive mis à jour (choix de l'utilisatrice) : sur PC, la fiche d'une recette s'ouvre en entier au lieu du panneau de 380 px ; nouvelle exception « formulaire de recette » (trois colonnes ingrédients / étapes / infos dès 1080 px de zone de contenu, deux de 720 à 1079 px, une sur téléphone, un champ par étape). Carte de PROJET.md alignée (section Design).

<!-- ia-kit:synchro arbre=d8db4a5b5afd13ad5d1a26f5b459a4a8663bab3f projet=418256f6cb437e13fb4cbe16c471d2c3fc1d1982 : point de synchro des hooks ia-kit, ne pas modifier -->
