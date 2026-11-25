import { Link } from 'react-router';
import { displayNameFor } from '../../utils/names.js';
import { formatSemaine } from '../../utils/planning.js';
import Ticket from '../ui/Ticket.jsx';

// Les personnes dont je peux lire le planning : un lien par personne, avec ce qu'elle m'a ouvert.
export default function ListePlanningsPartages({ people, userId }) {
  return (
    <Ticket>
      <ul className="divide-y-2 divide-dotted divide-tirets">
        {people.map(({ owner, allWeeks, weeks }) => (
          <li key={owner.id}>
            <Link
              to={`/planning/partages/${owner.id}`}
              className="block py-3 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus"
            >
              <span className="block font-extrabold">{displayNameFor(owner, userId)}</span>
              <span className="block text-mention text-encre-2">
                {allWeeks
                  ? 'tout le planning'
                  : weeks.length === 1
                    ? `semaine du ${formatSemaine(weeks[0])}`
                    : `${weeks.length} semaines`}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Ticket>
  );
}
