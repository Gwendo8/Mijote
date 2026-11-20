import EtatVide from '../../components/ui/EtatVide.jsx';

// Écran pas encore construit (blocs suivants) : garde la navigation utilisable en attendant.
export default function PlaceholderPage({ titre }) {
  return (
    <div className="mx-auto max-w-md">
      <h1 className="largeur-large mb-4 text-ecran font-extrabold lg:text-ecran-pc">{titre}</h1>
      <EtatVide titre="Bientôt" texte="Cet écran arrive dans un prochain bloc de l’application." />
    </div>
  );
}
