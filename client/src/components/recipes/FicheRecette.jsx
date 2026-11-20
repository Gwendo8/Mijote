import { useState } from 'react';
import Tampon from '../ui/Tampon.jsx';
import CodeBarres from '../ui/CodeBarres.jsx';
import Ticket, { TicketEntete, TicketTirets } from '../ui/Ticket.jsx';
import { formatNombre } from '../../utils/foods.js';
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
          `${recipe.kind === 'idea' ? 'idée' : 'recette'} pour ${formatParts(recipe.servings)}`,
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
      <SelecteurParts value={servings} onChange={setServings} />
      <ul className="mt-3">
        {recipe.ingredients.map((ingredient) => (
          <LigneIngredient
            key={ingredient.id}
            label={scaleLabel(ingredient.label, factor)}
            grams={scaleGrams(ingredient.grams, factor)}
            negligible={ingredient.isNegligible}
          />
        ))}
      </ul>
      <TicketTirets />
      <TotalParPart kcal={vue.kcal} partialKcal={vue.partialKcal} proteins={vue.proteins}>
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
