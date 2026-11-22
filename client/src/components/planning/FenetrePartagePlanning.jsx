import { useState } from 'react';
import { useCreateShare } from '../../hooks/planning/usePlanning.js';
import { ApiError } from '../../services/api.js';
import { formatSemaine, mondayOf, today } from '../../utils/planning.js';
import { getErrorMessage } from '../../utils/errorMessage.js';
import { ChoixPersonnes } from '../recipes/ChoixVisibilite.jsx';
import Bouton from '../ui/Bouton.jsx';
import Champ from '../ui/Champ.jsx';
import Fenetre from '../ui/Fenetre.jsx';
import MessageErreur from '../ui/MessageErreur.jsx';
import { TicketTirets } from '../ui/Ticket.jsx';

const radio = 'mt-0.5 size-5 shrink-0 cursor-pointer accent-vert';

// « Partager mon planning » : avec tout le monde ou des personnes choisies, tout le planning ou des semaines
// choisies. Toujours en lecture seule. Un partage = une personne (ou tout le monde) x une semaine (ou tout) :
// on les crée un par un ; « Déjà partagé » (409) n'est pas une erreur ici, c'est ce qu'on voulait.
export default function FenetrePartagePlanning({ userId, onDone, onClose }) {
  const [cible, setCible] = useState('people'); // 'people' | 'all'
  const [people, setPeople] = useState([]);
  const [portee, setPortee] = useState('all'); // 'all' | 'weeks'
  const [weeks, setWeeks] = useState([]);
  const [date, setDate] = useState(today);
  const [invalid, setInvalid] = useState('');
  const [error, setError] = useState('');
  const create = useCreateShare();

  const addWeek = () => {
    if (!date) return;
    const monday = mondayOf(date);
    setWeeks((old) => (old.includes(monday) ? old : [...old, monday].sort()));
  };

  async function submit(event) {
    event.preventDefault();
    setError('');
    if (cible === 'people' && people.length === 0)
      return setInvalid('Choisis au moins une personne, ou « Tout le monde »');
    if (portee === 'weeks' && weeks.length === 0)
      return setInvalid('Ajoute au moins une semaine, ou choisis « Tout le planning »');
    setInvalid('');
    const users = cible === 'all' ? [null] : people.map((person) => person.id);
    const starts = portee === 'all' ? [null] : weeks;
    for (const user of users) {
      for (const start of starts) {
        const result = await create.run(user, start);
        if (!result.ok && !(result.error instanceof ApiError && result.error.status === 409)) {
          setError(getErrorMessage(result.error));
          onDone(); // ce qui est déjà créé apparaît dans la liste
          return;
        }
      }
    }
    onDone();
    onClose();
  }

  return (
    <Fenetre titre="Partager mon planning" onClose={onClose} large>
      <form onSubmit={submit} noValidate>
        <fieldset className="space-y-2">
          <legend className="mb-2 text-libelle font-extrabold uppercase">Avec qui ?</legend>
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="radio"
              name="cible"
              checked={cible === 'people'}
              onChange={() => setCible('people')}
              className={radio}
            />
            <span>
              <span className="block text-ui font-extrabold">Des personnes choisies</span>
              <span className="block text-mention text-encre-2">cherchées par leur nom</span>
            </span>
          </label>
          {cible === 'people' && (
            <ChoixPersonnes people={people} userId={userId} onChange={setPeople} />
          )}
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="radio"
              name="cible"
              checked={cible === 'all'}
              onChange={() => setCible('all')}
              className={radio}
            />
            <span>
              <span className="block text-ui font-extrabold">Tout le monde</span>
              <span className="block text-mention text-encre-2">
                toutes les personnes connectées à Mijote
              </span>
            </span>
          </label>
        </fieldset>
        <TicketTirets />
        <fieldset className="space-y-2">
          <legend className="mb-2 text-libelle font-extrabold uppercase">Quelles semaines ?</legend>
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="radio"
              name="portee"
              checked={portee === 'all'}
              onChange={() => setPortee('all')}
              className={radio}
            />
            <span>
              <span className="block text-ui font-extrabold">Tout le planning</span>
              <span className="block text-mention text-encre-2">
                y compris les semaines à venir
              </span>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="radio"
              name="portee"
              checked={portee === 'weeks'}
              onChange={() => setPortee('weeks')}
              className={radio}
            />
            <span>
              <span className="block text-ui font-extrabold">Des semaines choisies</span>
              <span className="block text-mention text-encre-2">
                une date suffit : la semaine qui la contient
              </span>
            </span>
          </label>
          {portee === 'weeks' && (
            <div className="space-y-2 pl-8">
              <div className="flex items-end gap-2">
                <Champ
                  className="flex-1"
                  label="Un jour de la semaine"
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                />
                <Bouton type="contour" onClick={addWeek} disabled={!date}>
                  Ajouter cette semaine
                </Bouton>
              </div>
              {weeks.length > 0 && (
                <ul>
                  {weeks.map((monday) => (
                    <li key={monday} className="flex items-center justify-between py-1">
                      <span>Semaine du {formatSemaine(monday)}</span>
                      <button
                        type="button"
                        className="cursor-pointer text-libelle font-bold underline"
                        onClick={() => setWeeks((old) => old.filter((w) => w !== monday))}
                        aria-label={`Enlever la semaine du ${formatSemaine(monday)}`}
                      >
                        Enlever
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </fieldset>
        <TicketTirets />
        <p className="mb-4 font-text text-ui text-encre-2">
          Les autres voient ton planning sans pouvoir le modifier ni le copier.
        </p>
        <div className="mb-3">
          <MessageErreur>{invalid || error || null}</MessageErreur>
        </div>
        <div className="flex flex-col gap-3 lg:flex-row-reverse">
          <Bouton htmlType="submit" pending={create.pending} pendingLabel="Partage…">
            Partager
          </Bouton>
          <Bouton type="contour" onClick={onClose}>
            Annuler
          </Bouton>
        </div>
      </form>
    </Fenetre>
  );
}
