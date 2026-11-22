import { useEffect, useState } from 'react';
import { Pencil } from 'lucide-react';
import { useSession } from '../../hooks/auth/useSession.js';
import { IDEA_NEEDS_FOOD, recipeFormSchema, recipeFormValues } from '../../schemas/recipes.js';
import { parseDecimal, toFieldText } from '../../utils/foods.js';
import {
  computeNutrition,
  emptyRow,
  emptyStep,
  ingredientBody,
  rowFromIngredient,
  rowsFromDraft,
  stepsFromText,
  stepsToText,
} from '../../utils/recipes.js';
import { validate } from '../../utils/validate.js';
import Bouton from '../ui/Bouton.jsx';
import Champ from '../ui/Champ.jsx';
import ChampTexteLong from '../ui/ChampTexteLong.jsx';
import MessageErreur from '../ui/MessageErreur.jsx';
import Ticket from '../ui/Ticket.jsx';
import ChampsEtapes from './ChampsEtapes.jsx';
import ChampPhoto from './ChampPhoto.jsx';
import ChoixEtiquettes from './ChoixEtiquettes.jsx';
import ChoixVisibilite from './ChoixVisibilite.jsx';
import LignesIngredients from './LignesIngredients.jsx';
import TotalParPart from './TotalParPart.jsx';
import { Link2 } from 'lucide-react';

// Au moins un champ d'étape pour commencer
const startSteps = (text) => {
  const steps = stepsFromText(text);
  return steps.length > 0 ? steps : [emptyStep()];
};

export const FORM_ID = 'formulaire-recette';

// Point de départ du formulaire : la recette qu'on modifie, le brouillon d'un import, ou rien.
function initialState({ initial, draft, sourceUrl, idee }) {
  const source = initial ?? draft ?? {};
  return {
    fields: {
      title: source.title ?? '',
      description: source.description ?? '',
      servings: String(source.servings ?? 1),
      prepTimeMinutes: toFieldText(source.prepTimeMinutes),
      cookTimeMinutes: toFieldText(source.cookTimeMinutes),
      sourceUrl: source.sourceUrl ?? sourceUrl ?? '',
      caloriesManual: toFieldText(initial?.caloriesPerServingManual),
      proteinsManual: toFieldText(initial?.proteinsPerServingManual),
    },
    steps: startSteps(source.instructions),
    rows: initial
      ? initial.ingredients.map(rowFromIngredient)
      : draft
        ? rowsFromDraft(draft.ingredients)
        : idee
          ? [] // une idée n'a que des aliments choisis : pas de ligne à écrire à la main
          : [emptyRow()],
    tagIds: initial?.tags.map((tag) => tag.id) ?? [],
    visibility: {
      visibility: initial?.visibility ?? 'private',
      people: initial?.sharedWith ?? [],
    },
    manualOpen:
      initial?.caloriesPerServingManual != null || initial?.proteinsPerServingManual != null,
  };
}

// Formulaire d'une recette (ou d'une idée de plat avec kind="idea") : création et modification.
// Vérifie les saisies avant l'envoi (mêmes messages que l'API) ; les erreurs de l'API (`fieldErrors`) s'affichent
// aussi sous les champs. `onSubmit(body, photo)` reçoit le corps prêt pour l'API et { file, removed } pour la photo.
// L'adresse de la photo d'un import (`draft.imageUrl`) part dans `photoUrl` (création seulement) : le serveur la télécharge.
export default function FormulaireRecette({
  kind = 'recipe',
  initial = null,
  draft = null,
  sourceUrl = '',
  pending = false,
  error = null,
  fieldErrors = {},
  onSubmit,
}) {
  const { user } = useSession();
  const idee = kind === 'idea';
  const [start] = useState(() => initialState({ initial, draft, sourceUrl, idee }));
  const [fields, setFields] = useState(start.fields);
  const [rows, setRows] = useState(start.rows);
  const [steps, setSteps] = useState(start.steps);
  const [tagIds, setTagIds] = useState(start.tagIds);
  const [visibility, setVisibility] = useState(start.visibility);
  const [manualOpen, setManualOpen] = useState(start.manualOpen);
  const [errors, setErrors] = useState({});
  const [photo, setPhoto] = useState({ file: null, preview: null, removed: false });
  const [photoError, setPhotoError] = useState('');

  // Aperçu d'une photo choisie : l'adresse locale est libérée quand elle change ou à la fermeture
  useEffect(() => () => photo.preview && URL.revokeObjectURL(photo.preview), [photo.preview]);

  const change = (field) => (event) => setFields({ ...fields, [field]: event.target.value });
  const shown = { ...fieldErrors, ...errors };
  const ingredientErrors = {};
  for (const [key, message] of Object.entries(shown)) {
    const match = /^ingredients\.(\d+\.(?:label|grams))$/.exec(key);
    if (match) ingredientErrors[match[1]] = message;
  }

  const calcul = computeNutrition(rows, fields.servings);
  const apercuPhoto =
    photo.preview ?? (photo.removed ? null : (initial?.photoUrl ?? draft?.imageUrl ?? null));

  function pickPhoto(file) {
    if (file.size > 25 * 1024 * 1024) {
      return setPhotoError('Cette photo est trop lourde. Choisis une image de moins de 25 Mo.');
    }
    setPhotoError('');
    setPhoto({ file, preview: URL.createObjectURL(file), removed: false });
  }

  function submit(event) {
    event.preventDefault();
    const values = recipeFormValues(
      {
        ...fields,
        instructions: stepsToText(steps),
        ...visibility,
        sharedWith: visibility.people.map((person) => person.id),
      },
      rows.map(ingredientBody),
    );
    if (!manualOpen) {
      values.caloriesPerServingManual = null;
      values.proteinsPerServingManual = null;
    }
    const result = validate(recipeFormSchema, values);
    const found = { ...(result.errors ?? {}) };
    if (idee && !rows.some((row) => row.food && row.gramsText.trim() !== '')) {
      found.ingredients = IDEA_NEEDS_FOOD;
    }
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    const data = result.data;
    const body = {
      title: data.title,
      description: data.description || null,
      instructions: idee ? null : data.instructions || null,
      servings: data.servings,
      prepTimeMinutes: idee ? null : data.prepTimeMinutes,
      cookTimeMinutes: idee ? null : data.cookTimeMinutes,
      sourceUrl: data.sourceUrl || null,
      visibility: data.visibility,
      sharedWith: data.visibility === 'shared' ? data.sharedWith : [],
      tagIds,
      caloriesPerServingManual: data.caloriesPerServingManual,
      proteinsPerServingManual: data.proteinsPerServingManual,
      ingredients: data.ingredients,
    };
    if (!initial && draft?.imageUrl && !photo.file && !photo.removed)
      body.photoUrl = draft.imageUrl;
    onSubmit(body, { file: photo.file, removed: photo.removed && !photo.file });
  }

  const nombre = (field, label, extra = {}) => (
    <Champ
      label={label}
      name={field}
      inputMode="numeric"
      autoComplete="off"
      value={fields[field]}
      onChange={change(field)}
      error={shown[field]}
      {...extra}
    />
  );

  const partiel = !manualOpen && calcul.missing > 0;
  const kcalAffiche = manualOpen ? null : calcul.known ? calcul.perServing.calories : null;
  const protAffiche = manualOpen ? null : calcul.known ? calcul.perServing.proteins : null;
  const generale = error && Object.keys(fieldErrors).length === 0 ? error : null;

  return (
    <form id={FORM_ID} onSubmit={submit} noValidate>
      {/* Trois colonnes quand la place le permet (ingrédients, étapes, infos), deux sinon (infos au-dessus),
          une sur téléphone (infos, ingrédients, étapes). La place se mesure sur la zone de contenu, pas sur l'écran :
          le menu de gauche en prend une partie. */}
      <div className="@container">
        <div
          className={`grid grid-cols-[minmax(0,1fr)] items-start gap-5 @min-[720px]:gap-7 ${
            idee
              ? '@min-[720px]:grid-cols-[minmax(0,1fr)_minmax(0,360px)]'
              : '@min-[720px]:grid-cols-2 @min-[1080px]:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,360px)]'
          }`}
        >
          {/* Les infos : en premier sur téléphone, au-dessus en deux colonnes, à droite en trois */}
          <div
            className={
              idee
                ? '@min-[720px]:col-start-2 @min-[720px]:row-start-1'
                : '@min-[720px]:col-span-2 @min-[720px]:grid @min-[720px]:grid-cols-2 @min-[720px]:items-start @min-[720px]:gap-7 @min-[1080px]:col-span-1 @min-[1080px]:col-start-3 @min-[1080px]:row-start-1 @min-[1080px]:block @min-[1080px]:space-y-4'
            }
          >
            <div className="space-y-4">
              <ChampPhoto
                apercu={apercuPhoto}
                onPick={pickPhoto}
                onRemove={() => setPhoto({ file: null, preview: null, removed: true })}
                error={photoError}
              />
              <Champ
                label={idee ? 'Nom de l’assiette' : 'Titre'}
                name="title"
                autoComplete="off"
                value={fields.title}
                onChange={change('title')}
                error={shown.title}
              />
              <ChampTexteLong
                label="Description (facultatif)"
                name="description"
                rows={2}
                value={fields.description}
                onChange={change('description')}
                error={shown.description}
              />
              <div className={`grid gap-3 ${idee ? 'grid-cols-1' : 'grid-cols-3'}`}>
                {nombre('servings', 'Parts', { placeholder: '1' })}
                {!idee && nombre('prepTimeMinutes', 'Prépa.', { placeholder: 'min' })}
                {!idee && nombre('cookTimeMinutes', 'Cuisson', { placeholder: 'min' })}
              </div>
              {!idee && (
                <Champ
                  label="Lien d’origine (facultatif)"
                  name="sourceUrl"
                  type="url"
                  icone={Link2}
                  autoComplete="off"
                  inputMode="url"
                  placeholder="https://"
                  value={fields.sourceUrl}
                  onChange={change('sourceUrl')}
                  error={shown.sourceUrl}
                />
              )}
            </div>
            <div className="mt-4 space-y-4 @min-[720px]:mt-0 @min-[1080px]:mt-4">
              <ChoixEtiquettes value={tagIds} onChange={setTagIds} />
              <ChoixVisibilite
                value={visibility}
                onChange={setVisibility}
                userId={user?.id}
                error={shown.sharedWith}
              />
              <Ticket aere>
                <TotalParPart
                  kcal={manualOpen ? parseDecimal(fields.caloriesManual) : null}
                  partialKcal={kcalAffiche}
                  proteins={manualOpen ? parseDecimal(fields.proteinsManual) : protAffiche}
                >
                  {partiel && (
                    <p className="mt-2 font-text text-ui text-encre-2">
                      {calcul.known
                        ? `Calcul partiel : ${calcul.missing} ${calcul.missing > 1 ? 'ingrédients ne sont pas reliés' : 'ingrédient n’est pas relié'}. Relie-${calcul.missing > 1 ? 'les' : 'le'}, ou corrige les calories à la main.`
                        : 'Relie les ingrédients à des aliments pour calculer les calories, ou saisis-les à la main.'}
                    </p>
                  )}
                  {manualOpen ? (
                    <div className="mt-3 space-y-3">
                      <Champ
                        label="Calories par part"
                        name="caloriesManual"
                        inputMode="decimal"
                        autoComplete="off"
                        value={fields.caloriesManual}
                        onChange={change('caloriesManual')}
                        error={shown.caloriesPerServingManual}
                      />
                      <Champ
                        label="Protéines par part (g)"
                        name="proteinsManual"
                        inputMode="decimal"
                        autoComplete="off"
                        value={fields.proteinsManual}
                        onChange={change('proteinsManual')}
                        error={shown.proteinsPerServingManual}
                      />
                      <Bouton
                        type="contour"
                        onClick={() => {
                          setManualOpen(false);
                          setFields({ ...fields, caloriesManual: '', proteinsManual: '' });
                        }}
                      >
                        Revenir au calcul
                      </Bouton>
                    </div>
                  ) : (
                    <div className="mt-3">
                      <Bouton type="contour" onClick={() => setManualOpen(true)}>
                        <Pencil size={14} strokeWidth={1.8} aria-hidden="true" />
                        Corriger à la main
                      </Bouton>
                    </div>
                  )}
                </TotalParPart>
              </Ticket>
            </div>
          </div>

          {/* Les ingrédients : à gauche */}
          <div className={idee ? '@min-[720px]:col-start-1 @min-[720px]:row-start-1' : ''}>
            <LignesIngredients
              rows={rows}
              onChange={setRows}
              errors={ingredientErrors}
              error={shown.ingredients}
              idee={idee}
            />
          </div>

          {/* Les étapes : au milieu */}
          {!idee && <ChampsEtapes steps={steps} onChange={setSteps} error={shown.instructions} />}
        </div>
      </div>

      <div className="mt-5 space-y-3 lg:hidden">
        <MessageErreur>{generale}</MessageErreur>
        <Bouton
          htmlType="submit"
          pending={pending}
          pendingLabel="Enregistrement…"
          className="w-full"
        >
          {idee ? 'Enregistrer l’idée' : 'Enregistrer la recette'}
        </Bouton>
      </div>
      <div className="mt-5 hidden max-w-lg lg:block">
        <MessageErreur>{generale}</MessageErreur>
      </div>
    </form>
  );
}
