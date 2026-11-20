import { Link } from 'react-router';
import Bouton from '../../components/ui/Bouton.jsx';
import EtatVide from '../../components/ui/EtatVide.jsx';

export default function NotFoundPage() {
  return (
    <div className="mx-auto max-w-md">
      <EtatVide titre="Page introuvable" texte="Cette page n’existe pas ou a été déplacée.">
        <Bouton as={Link} to="/" type="contour">
          Retour à l’accueil
        </Bouton>
      </EtatVide>
    </div>
  );
}
