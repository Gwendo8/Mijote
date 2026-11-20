import { Navigate, Outlet, useLocation } from 'react-router';
import { useSession } from '../../hooks/auth/useSession.js';
import Bouton from '../ui/Bouton.jsx';
import Chargement from '../ui/Chargement.jsx';
import EtatVide from '../ui/EtatVide.jsx';

// Barrière des écrans connectés : sans session, retour à /connexion (on retient la page demandée).
// Ce n'est qu'un confort : le serveur vérifie lui-même les droits à chaque appel.
export default function RequireAuth({ admin = false }) {
  const { status, user, retry } = useSession();
  const location = useLocation();

  if (status === 'loading') {
    return (
      <div className="mx-auto max-w-md p-4">
        <Chargement />
      </div>
    );
  }
  if (status === 'error') {
    return (
      <div className="mx-auto max-w-md p-4">
        <EtatVide
          titre="Pas de réseau"
          texte="Impossible de joindre le serveur. Vérifie ta connexion, puis réessaie."
        >
          <Bouton onClick={retry}>Réessayer</Bouton>
        </EtatVide>
      </div>
    );
  }
  if (status === 'anonymous') {
    return (
      <Navigate to="/connexion" replace state={{ from: location.pathname + location.search }} />
    );
  }
  if (admin && user.role !== 'admin') return <Navigate to="/" replace />;
  return <Outlet />;
}
