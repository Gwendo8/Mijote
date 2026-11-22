import EnTetePage from '../../components/layout/EnTetePage.jsx';
import ListePlanningsPartages from '../../components/planning/ListePlanningsPartages.jsx';
import Chargement from '../../components/ui/Chargement.jsx';
import EtatVide from '../../components/ui/EtatVide.jsx';
import MessageErreur from '../../components/ui/MessageErreur.jsx';
import { useSession } from '../../hooks/auth/useSession.js';
import { useSharedWithMe } from '../../hooks/planning/usePlanning.js';

// `/planning/partages` : les plannings que d'autres personnes ont partagés avec moi.
export default function PlanningsPartagesPage() {
  const { user } = useSession();
  const { people, loading, error } = useSharedWithMe();

  return (
    <div>
      <EnTetePage titre="Plannings partagés" retour />
      {loading && <Chargement label="Chargement…" />}
      <MessageErreur>{error}</MessageErreur>
      {!loading && !error && people.length === 0 && (
        <EtatVide texte="Personne n’a partagé son planning avec toi pour l’instant." />
      )}
      {people.length > 0 && (
        <div className="max-w-130">
          <ListePlanningsPartages people={people} userId={user?.id} />
        </div>
      )}
    </div>
  );
}
