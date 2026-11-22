import { useState } from 'react';
import Tampon from '../ui/Tampon.jsx';
import CodeBarres from '../ui/CodeBarres.jsx';
import Ticket, { TicketEntete, TicketLigne, TicketPartie, TicketTirets } from '../ui/Ticket.jsx';
import { formatNombre, sourceLabel } from '../../utils/foods.js';
import {
  detailTemps,
  formatParts,
  nutritionView,
  scaleGrams,
  scaleLabel,
} from '../../utils/recipes.js';
import EtapesRecette from './EtapesRecette.jsx';
import LegendeMacros from './LegendeMacros.jsx';
import LigneIngredient from './LigneIngredient.jsx';
import SelecteurParts from './SelecteurParts.jsx';
import TotalParPart from './TotalParPart.jsx';

// Le ticket d'une recette : en-tête, description, tampon, parts réglables, ingrédients, total « PAR PART ».
// `avecEtapes` : les étapes et le code-barres sont dans le même ticket (téléphone) ; sur PC elles ont leur propre ticket.
// Régler les parts change les quantités (grammes et nombres au début des textes) ; les calories PAR PART ne bougent pas,
// on ajoute le total du plat pour le nombre de parts choisi.
// Utiliser avec `key={recipe.id}` : les parts repartent de celles de la recette.
export default function FicheRecette({ recipe, avecEtapes = false }) {
  const [servings, setServings] = useState(recipe.servings);
  const factor = servings / recipe.servings;
  const idee = recipe.kind === 'idea';
  const vue = nutritionView(recipe.nutrition);
  const temps = detailTemps(recipe);
  const totalPlat =
    recipe.nutrition?.total && vue.complete && !vue.manual
      ? Math.round(recipe.nutrition.total.calories * factor)
      : null;

  return (
    <Ticket>
      <TicketEntete
        titre={recipe.title}
        as="h2"
        sousTitre={[
          idee
            ? `idée de plat, ${formatParts(recipe.servings)}`
            : `recette pour ${formatParts(recipe.servings)}`,
          temps,
        ]
          .filter(Boolean)
          .map((ligne, i) => (
            <span key={i} className="block">
              {ligne}
            </span>
          ))}
      />
      {recipe.description && (
        <p className="mb-4 font-text text-lecture leading-[1.55] [overflow-wrap:anywhere]">
          {recipe.description}
        </p>
      )}
      <div className="my-4 flex justify-center">
        <Tampon
          taille={150}
          kcal={vue.kcal}
          photoUrl={recipe.photoUrl}
          {...vue.macros}
          label={recipe.photoUrl ? `Photo de ${recipe.title}` : undefined}
        />
      </div>
      {vue.kcal !== null || vue.partialKcal !== null ? <LegendeMacros macros={vue.macros} /> : null}
      <TicketTirets />
      {!(idee && recipe.servings === 1) && (
        <SelecteurParts value={servings} onChange={setServings} />
      )}
      {idee && <TicketPartie>Dans l’assiette</TicketPartie>}
      <ul className="mt-3">
        {recipe.ingredients.map((ingredient) =>
          idee ? (
            <LigneIngredient
              key={ingredient.id}
              label={ingredient.label}
              cochable={false}
              detail={detailAliment(ingredient, factor)}
              valeur={kcalAliment(ingredient, factor)}
            />
          ) : (
            <LigneIngredient
              key={ingredient.id}
              label={scaleLabel(ingredient.label, factor)}
              grams={scaleGrams(ingredient.grams, factor)}
              negligible={ingredient.isNegligible}
            />
          ),
        )}
      </ul>
      <TicketTirets />
      {idee && vue.manual && recipe.nutrition?.perServing && (
        <>
          <TicketLigne
            nom="calcul"
            valeur={
              vue.complete ? formatNombre(recipe.nutrition.perServing.calories, 0) : 'à compléter'
            }
          />
          <TicketLigne
            nom={<strong>corrigé à la main</strong>}
            valeur={formatNombre(vue.kcal, 0)}
          />
        </>
      )}
      <TotalParPart
        libelle={idee && recipe.servings === 1 ? 'Total' : 'Par part'}
        kcal={vue.kcal}
        partialKcal={vue.partialKcal}
        proteins={vue.proteins}
      >
        {vue.kcal === null && vue.missing > 0 && (
          <p className="mt-2 font-text text-ui text-encre-2">
            Calories à compléter : {vue.missing}{' '}
            {vue.missing > 1 ? 'ingrédients ne sont pas reliés' : 'ingrédient n’est pas relié'} à un
            aliment avec ses grammes.
          </p>
        )}
        {totalPlat !== null && servings !== recipe.servings && (
          <p className="mt-2 font-text text-ui text-encre-2">
            Pour {formatParts(servings)} : {formatNombre(totalPlat, 0)} kcal en tout.
          </p>
        )}
      </TotalParPart>
      {avecEtapes && (
        <>
          <TicketTirets />
          <EtapesRecette instructions={recipe.instructions} />
          <CodeBarres />
        </>
      )}
    </Ticket>
  );
}

// Idée de plat : sous le nom, « Ciqual, 150 g » (l'origine de l'aliment et ses grammes).
function detailAliment(ingredient, factor) {
  const grams = scaleGrams(ingredient.grams, factor);
  return [
    ingredient.food ? sourceLabel(ingredient.food.source) : null,
    grams !== null ? `${formatNombre(grams)} g` : 'grammes à compléter',
  ]
    .filter(Boolean)
    .join(', ');
}

// Les calories de la ligne, pour les grammes affichés ; « ? » si l'aliment ou les grammes manquent.
function kcalAliment(ingredient, factor) {
  const grams = scaleGrams(ingredient.grams, factor);
  const kcal = ingredient.food?.energyKcal;
  if (grams === null || kcal === null || kcal === undefined) return '?';
  return formatNombre((kcal * grams) / 100, 0);
}
