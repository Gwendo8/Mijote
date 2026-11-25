import { ChevronLeft } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router';

// Bouton retour d'un écran de détail : revient à l'écran d'où l'on vient (la recherche gardée telle quelle),
// ou va à `to` quand on est arrivé directement sur l'écran (lien, rechargement).
// Téléphone : une icône de 40 px ; PC : l'icône et `libelle` (« Aliments »).
export default function BoutonRetour({ to, libelle }) {
  const navigate = useNavigate();
  const location = useLocation();
  const classes =
    'inline-flex size-10 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-coin border-[1.5px] border-trait bg-fond font-heading text-ui font-extrabold lg:h-11 lg:w-auto lg:px-4';
  const contenu = (
    <>
      <ChevronLeft size={20} strokeWidth={1.8} aria-hidden="true" />
      <span className="hidden lg:inline">{libelle}</span>
    </>
  );

  if (location.key === 'default') {
    return (
      <Link to={to} aria-label={`Retour : ${libelle}`} className={classes}>
        {contenu}
      </Link>
    );
  }
  return (
    <button
      type="button"
      onClick={() => navigate(-1)}
      aria-label={`Retour : ${libelle}`}
      className={classes}
    >
      {contenu}
    </button>
  );
}
