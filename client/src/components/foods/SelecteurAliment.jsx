import { useState } from 'react';
import { useDebounced } from '../../hooks/common/useDebounced.js';
import { MIN_LENGTH, useFoodSearch } from '../../hooks/foods/useFoodSearch.js';
import {
  foodName,
  foodSummary,
  formatKcal,
  parseDecimal,
  portionValues,
} from '../../utils/foods.js';
import { calculerGrammes } from '../../utils/quantites.js';
import Bouton from '../ui/Bouton.jsx';
import Champ from '../ui/Champ.jsx';
import MessageErreur from '../ui/MessageErreur.jsx';
import AlimentLigne from './AlimentLigne.jsx';
import ChampRecherche from './ChampRecherche.jsx';

// Sélecteur d'aliment réutilisable (formulaire de recette, idées de plats, planning) :
// 1. on cherche, 2. on touche un aliment, 3. on donne les grammes, 4. « Ajouter » appelle `onAdd({ food, grams })`.
// `demanderPoids` (« Relier ») : sans calcul possible, un message demande le poids réel.
// Avec `quantite` (lue dans le texte d'une ligne, voir utils/quantites.js), le choix de l'aliment remplit les grammes
// tout seul quand le calcul est possible (« 20 cl » de lait, « 2 œufs ») : la case reste modifiable.
// Il cherche dans tout (Ciqual, Open Food Facts en cache, mes aliments). Il ne crée rien et n'appelle pas l'API
// lui-même : la recherche passe par `useFoodSearch`.
export default function SelecteurAliment({
  onAdd,
  submitLabel = 'Ajouter',
  initialGrams = '100',
  quantite = null,
  demanderPoids = false,
}) {
  const [q, setQ] = useState('');
  const [food, setFood] = useState(null);
  const [gramsText, setGramsText] = useState(initialGrams);
  const [gramsError, setGramsError] = useState('');
  const [calcul, setCalcul] = useState(null); // grammes calculés d'après la ligne, ou null
  const search = useFoodSearch(useDebounced(q), 'all');

  function choose(item) {
    const calcule = calculerGrammes(quantite, item.measures);
    setFood(item);
    setCalcul(calcule);
    // Densité inconnue (estimée comme l'eau) : on ne pré-remplit pas, un poids deviné pourrait fausser la recette
    const sur = calcule && !calcule.estime;
    setGramsText(sur ? String(calcule.grammes).replace('.', ',') : initialGrams);
    setGramsError('');
  }

  function add(event) {
    event.preventDefault();
    // Le sélecteur s'ouvre souvent dans le formulaire d'une recette : sans cela, React fait remonter
    // l'envoi jusqu'à ce formulaire, qui s'enverrait en entier.
    event.stopPropagation();
    const grams = parseDecimal(gramsText);
    if (grams === null || grams <= 0) {
      return setGramsError('Indique un poids en grammes, par exemple 150');
    }
    onAdd({ food, grams });
    setFood(null);
    setCalcul(null);
    setQ('');
    setGramsText(initialGrams);
  }

  if (food) {
    const { kcal } = portionValues(food, parseDecimal(gramsText) ?? NaN);
    return (
      <form onSubmit={add} noValidate className="space-y-3">
        <div>
          <p className="font-extrabold [overflow-wrap:anywhere]">{foodName(food)}</p>
          <p className="text-mention text-encre-2">
            {foodSummary(food)}, {formatKcal(food.energyKcal)} pour 100 g
          </p>
        </div>
        {(quantite || demanderPoids) && (
          <p role="status" className="text-mention text-encre-2">
            {calcul && calcul.estime
              ? `Je ne sais pas combien pèsent ${quantite.texte} de cet aliment (environ ${String(calcul.grammes).replace('.', ',')} g si c’est comme de l’eau). Indique le poids en grammes.`
              : calcul
                ? calcul.explication
                : 'Je ne peux pas calculer le poids de cette ligne : indique le poids réel en grammes (sur l’emballage, par exemple).'}
          </p>
        )}
        <Champ
          label="Poids (g)"
          name="grams"
          inputMode="decimal"
          autoComplete="off"
          value={gramsText}
          onChange={(event) => setGramsText(event.target.value)}
          error={gramsError}
          help={kcal === null ? undefined : `Environ ${formatKcal(Math.round(kcal))}`}
        />
        <div className="flex gap-3">
          <Bouton htmlType="submit">{submitLabel}</Bouton>
          <Bouton type="contour" onClick={() => setFood(null)}>
            Changer d’aliment
          </Bouton>
        </div>
      </form>
    );
  }

  const searching = q.trim().length >= MIN_LENGTH;
  return (
    <div className="space-y-3">
      <ChampRecherche value={q} onChange={setQ} />
      {!searching && (
        <p className="font-text text-ui text-encre-2">Tape au moins 2 lettres pour chercher.</p>
      )}
      <MessageErreur>{search.error}</MessageErreur>
      {searching && !search.loading && !search.error && search.items.length === 0 && (
        <p role="status" className="font-text text-lecture">
          Aucun aliment trouvé. Essaie un autre mot, ou crée ton aliment.
        </p>
      )}
      {search.loading && (
        <p role="status" className="text-ui text-encre-2">
          Recherche…
        </p>
      )}
      {search.items.length > 0 && (
        <ul className="max-h-72 divide-y-2 divide-dotted divide-pointilles overflow-y-auto">
          {search.items.map((item) => (
            <AlimentLigne key={item.id} food={item} onChoose={choose} unite />
          ))}
        </ul>
      )}
    </div>
  );
}
