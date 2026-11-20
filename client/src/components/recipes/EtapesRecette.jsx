import { TicketPartie } from '../ui/Ticket.jsx';
import { splitSteps } from '../../utils/recipes.js';

// Les étapes : numéros en vert (police des titres), texte en police des textes longs (16 px).
// `avecMention` : la mention « ÉTAPES » (téléphone) ; sur PC le ticket des étapes a son propre en-tête.
export default function EtapesRecette({ instructions, avecMention = true }) {
  const etapes = splitSteps(instructions);
  return (
    <div>
      {avecMention && <TicketPartie>Étapes</TicketPartie>}
      {etapes.length === 0 ? (
        <p className="font-text text-lecture text-encre-2">Aucune étape n’a été écrite.</p>
      ) : (
        <ol className="space-y-3.5">
          {etapes.map((etape, i) => (
            <li key={i} className="flex gap-3">
              <span
                aria-hidden="true"
                className="largeur-large w-5 shrink-0 text-lecture font-extrabold leading-[1.55] text-vert"
              >
                {i + 1}.
              </span>
              <span className="font-text text-lecture leading-[1.55] [overflow-wrap:anywhere]">
                {etape}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
