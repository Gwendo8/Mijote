import EnTetePage from '../../components/layout/EnTetePage.jsx';
import EtatVide from '../../components/ui/EtatVide.jsx';

// Écran pas encore construit (blocs suivants) : garde la navigation utilisable en attendant.
export default function PlaceholderPage({ titre }) {
  return (
    <div>
      <EnTetePage titre={titre} />
      <div className="max-w-md">
        <EtatVide
          titre="Bientôt"
          texte="Cet écran arrive dans un prochain bloc de l’application."
        />
      </div>
    </div>
  );
}
