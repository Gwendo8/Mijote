import { Link } from 'react-router';
import TexteTronque from '../ui/TexteTronque.jsx';
import Ticket from '../ui/Ticket.jsx';
import { formatGrammes, formatKcal, foodName, sourceLabel } from '../../utils/foods.js';
import AlimentLigne from './AlimentLigne.jsx';

// Résultats sur téléphone : un ticket « POUR 100 G … kcal » avec une ligne par aliment.
export function ListeAlimentsTicket({ foods }) {
  return (
    <Ticket>
      <div className="flex items-center gap-2 text-mention font-extrabold text-encre-2">
        <span>Pour 100 g</span>
        <span aria-hidden="true" className="flex-1 border-t-2 border-dotted border-encre/25" />
        <span className="text-ui text-encre">kcal</span>
      </div>
      <hr className="my-3 border-0 border-t-[1.5px] border-solid border-trait" />
      <ul className="divide-y-0">
        {foods.map((food) => (
          <AlimentLigne key={food.id} food={food} />
        ))}
      </ul>
    </Ticket>
  );
}

const th = 'pb-2.5 text-mention font-extrabold ';
const td = 'py-2.5';
const droite = 'text-right';
const gauche = 'text-left';
// Colonnes de taille fixe, sans retour à la ligne : un nom d'aliment long (fréquent dans Ciqual)
// ne doit jamais les écraser ; c'est la colonne « Aliment » qui passe à la ligne.
const colSource = 'w-40 whitespace-nowrap pl-4';
const colNombre = 'w-28 whitespace-nowrap pl-4';

// Résultats sur PC : un tableau dans un ticket (aliment, source, calories, protéines, glucides, lipides).
export function TableauAliments({ foods }) {
  return (
    <Ticket aere>
      <table className="w-full text-ui">
        <caption className="sr-only">Aliments trouvés, valeurs pour 100 g</caption>
        <thead>
          <tr className="border-b-[1.5px] border-solid border-trait">
            <th scope="col" className={`${th} ${gauche}`}>
              Aliment
            </th>
            <th scope="col" className={`${th} ${gauche} ${colSource}`}>
              Source
            </th>
            <th scope="col" className={`${th} ${droite} ${colNombre}`}>
              kcal
            </th>
            <th scope="col" className={`${th} ${droite} ${colNombre}`}>
              Protéines
            </th>
            <th scope="col" className={`${th} ${droite} ${colNombre}`}>
              Glucides
            </th>
            <th scope="col" className={`${th} ${droite} ${colNombre}`}>
              Lipides
            </th>
          </tr>
        </thead>
        <tbody>
          {foods.map((food) => (
            <tr key={food.id} className="border-b-2 border-dotted border-encre/25 last:border-0">
              <td className={`${td} ${gauche} max-w-0 pr-10`}>
                <Link
                  to={`/aliments/${food.id}`}
                  className="block font-medium underline-offset-2 hover:underline"
                >
                  {/* Nom long : une ligne avec « … », nom complet dans une bulle au survol */}
                  <TexteTronque>{foodName(food)}</TexteTronque>
                </Link>
              </td>
              <td className={`${td} ${gauche} ${colSource} text-encre-2`}>
                {sourceLabel(food.source)}
              </td>
              <td className={`${td} ${droite} ${colNombre} font-extrabold`}>
                {kcalNumber(food.energyKcal)}
              </td>
              <td className={`${td} ${droite} ${colNombre} text-prot-texte`}>
                {formatGrammes(food.proteinsG)}
              </td>
              <td className={`${td} ${droite} ${colNombre}`}>{formatGrammes(food.carbsG)}</td>
              <td className={`${td} ${droite} ${colNombre}`}>{formatGrammes(food.fatsG)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Ticket>
  );
}

// Dans le tableau la colonne s'appelle déjà « kcal » : le nombre seul suffit.
const kcalNumber = (value) => (value === null ? '—' : formatKcal(value).replace(' kcal', ''));
