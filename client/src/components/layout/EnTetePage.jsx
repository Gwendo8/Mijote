import { ChevronLeft, User, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router';

const bouton =
  'flex size-10 shrink-0 items-center justify-center rounded-coin border-[1.5px] border-encre bg-comptoir';

// Titre d'un écran connecté. Téléphone : le titre, et à droite le bouton du compte
// (ou, avec `retour`, un bouton retour à gauche ; `retour="fermer"` : une croix, pour un formulaire qu'on quitte). PC : le titre seul, le menu latéral fait le reste.
export default function EnTetePage({ titre, retour = false, children }) {
  const navigate = useNavigate();
  return (
    <header className="mb-4 flex items-center gap-3 lg:mb-5">
      {retour && (
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label={retour === 'fermer' ? 'Fermer' : 'Retour'}
          className={`${bouton} cursor-pointer lg:hidden`}
        >
          {retour === 'fermer' ? (
            <X size={20} strokeWidth={1.8} aria-hidden="true" />
          ) : (
            <ChevronLeft size={20} strokeWidth={1.8} aria-hidden="true" />
          )}
        </button>
      )}
      <h1
        className={`largeur-large min-w-0 flex-1 font-extrabold lg:text-ecran-pc ${
          retour ? 'text-[26px]' : 'text-ecran'
        }`}
      >
        {titre}
      </h1>
      {children}
      {!retour && (
        <Link to="/profil" aria-label="Mon compte" className={`${bouton} lg:hidden`}>
          <User size={20} strokeWidth={1.8} aria-hidden="true" />
        </Link>
      )}
    </header>
  );
}
