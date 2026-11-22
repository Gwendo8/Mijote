import { Users } from 'lucide-react';
import { Link } from 'react-router';
import CreneauxReglages from '../../components/planning/CreneauxReglages.jsx';
import PartagesReglages from '../../components/planning/PartagesReglages.jsx';
import EnTetePage from '../../components/layout/EnTetePage.jsx';
import Bouton from '../../components/ui/Bouton.jsx';
import { useSession } from '../../hooks/auth/useSession.js';
import { useAllSlots, useShares } from '../../hooks/planning/usePlanning.js';

// `/planning/reglages` : mes créneaux, puis qui voit mon planning (maquette « Planning — réglages »).
// Sur PC, les deux tickets sont côte à côte.
export default function ReglagesPlanningPage() {
  const { user } = useSession();
  const slots = useAllSlots();
  const shares = useShares();

  return (
    <div>
      <EnTetePage titre="Réglages" retour />
      <div className="space-y-4 lg:grid lg:grid-cols-2 lg:items-start lg:gap-8 lg:space-y-0">
        <CreneauxReglages {...slots} />
        <div className="space-y-4">
          <PartagesReglages {...shares} userId={user?.id} />
          <Bouton as={Link} to="/planning/partages" type="contour" className="w-full">
            <Users size={16} strokeWidth={1.8} aria-hidden="true" />
            Plannings partagés avec moi
          </Bouton>
        </div>
      </div>
    </div>
  );
}
