import { ChevronLeft } from 'lucide-react';
import { Link, Outlet, useLocation } from 'react-router';
import Etiquette from '../ui/Etiquette.jsx';
import Tampon from '../ui/Tampon.jsx';
// Vraies photos libres d'exemple : crédits dans assets/photos/CREDITS.md.
import PHOTO_SHAKSHUKA from '../../assets/photos/shakshuka.webp';
import PHOTO_BOLOGNAISE from '../../assets/photos/bolognaise.webp';
import PHOTO_DAL from '../../assets/photos/dal.webp';

const SOURCES = 'Données : Ciqual (ANSES), Open Food Facts';

// Cadre des écrans publics (connexion, inscription, mot de passe).
// Téléphone : « Mijote » en haut (avatar sur la connexion, bouton retour ailleurs), puis le ticket.
// PC : à gauche la vitrine (nom, phrase, deux étiquettes d'exemple), à droite le ticket.
export default function AuthLayout() {
  const enConnexion = useLocation().pathname === '/connexion';

  return (
    <main className="flex min-h-dvh flex-col justify-center bg-comptoir px-4 py-8 text-encre lg:flex-row lg:items-center lg:px-0 lg:py-12 lg:pr-[10%] lg:pl-16">
      <div className="mx-auto w-full max-w-md lg:max-w-none lg:flex lg:items-center lg:justify-between lg:gap-12">
        <div className="mb-3.5 flex items-center justify-between lg:hidden">
          <p className="largeur-large text-chiffre font-extrabold">Mijote</p>
          {enConnexion ? (
            <Tampon
              kcal={380}
              proteins={29}
              carbs={40}
              fats={12}
              taille={56}
              photoUrl={PHOTO_DAL}
            />
          ) : (
            <Link
              to="/connexion"
              aria-label="Retour à la connexion"
              className="flex size-10 items-center justify-center rounded-coin border-[1.5px] border-encre"
            >
              <ChevronLeft size={20} strokeWidth={1.8} aria-hidden="true" />
            </Link>
          )}
        </div>
        <Vitrine />
        <div className="lg:w-110 lg:shrink-0">
          <Outlet />
        </div>
        <p className="mt-4 text-mention text-encre-2 lg:hidden">{SOURCES}</p>
      </div>
    </main>
  );
}

// La vitrine du PC : décorative (exemples d'étiquettes), les vraies recettes sont dans l'appli.
function Vitrine() {
  return (
    <section aria-hidden="true" className="hidden max-w-xl lg:block">
      <p className="largeur-large text-[72px] leading-none font-extrabold">Mijote</p>
      <p className="mt-6 max-w-xl font-text text-[20px] leading-[1.55]">
        Tes recettes, tes idées de plats et ta semaine de repas. Les calories sont déjà
        additionnées.
      </p>
      <div className="mt-8 flex items-center gap-5">
        <div className="w-56 -rotate-3">
          <Etiquette
            photoUrl={PHOTO_SHAKSHUKA}
            titre="Shakshuka"
            detail="35 min, 2 parts"
            nutrition={{ caloriesPerServing: 270, proteinsPerServing: 17 }}
            macros={{ proteins: 17, carbs: 25, fats: 14 }}
          />
        </div>
        <div className="w-56 rotate-2">
          <Etiquette
            photoUrl={PHOTO_BOLOGNAISE}
            titre="Bolognaise aux petits pois"
            detail="45 min, 4 parts"
            nutrition={{ caloriesPerServing: 486, proteinsPerServing: 31 }}
            macros={{ proteins: 31, carbs: 45, fats: 20 }}
          />
        </div>
        <Tampon kcal={380} proteins={29} carbs={40} fats={12} taille={110} photoUrl={PHOTO_DAL} />
      </div>
      <p className="mt-8 text-ui text-encre-2">{SOURCES}</p>
    </section>
  );
}
