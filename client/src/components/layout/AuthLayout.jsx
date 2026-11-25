import { ChevronLeft } from 'lucide-react';
import { Link, Outlet, useLocation } from 'react-router';
import Anneau from '../ui/Anneau.jsx';
import Ticket from '../ui/Ticket.jsx';
// Vraies photos libres d'exemple : crédits dans assets/photos/CREDITS.md.
import PHOTO_SHAKSHUKA from '../../assets/photos/shakshuka.webp';
import PHOTO_BOLOGNAISE from '../../assets/photos/bolognaise.webp';
import PHOTO_DAL from '../../assets/photos/dal.webp';

const SOURCES = 'Données : Ciqual (ANSES), Open Food Facts, USDA FoodData Central';
const PHRASE =
  'Tes recettes, tes idées de plats et ta semaine de repas. Les calories sont déjà comptées.';

// Cadre des écrans publics (connexion, inscription, mot de passe), DESIGN.md § 6 « Connexion ».
// Téléphone : anneau avec photo et « Mijote », trois petits tickets de couleur en biais, puis le formulaire.
// PC : bloc centré de 1 120 px : à gauche la vitrine (nom, phrase, trois assiettes), à droite le formulaire.
export default function AuthLayout() {
  const enConnexion = useLocation().pathname === '/connexion';

  return (
    <main className="flex min-h-dvh flex-col justify-center bg-fond px-4 py-8 text-encre lg:items-center lg:px-10 lg:py-12">
      <div className="mx-auto w-full max-w-md lg:grid lg:max-w-280 lg:grid-cols-[1fr_460px] lg:items-center lg:gap-20">
        <div className="lg:hidden">
          {enConnexion ? (
            <>
              <div className="mb-4 flex items-center gap-4">
                <Anneau
                  kcal={270}
                  proteins={17}
                  carbs={25}
                  fats={14}
                  taille={92}
                  photoUrl={PHOTO_SHAKSHUKA}
                  label="Shakshuka"
                />
                <div>
                  <p className="text-[32px] leading-none font-extrabold tracking-[-0.035em]">
                    Mijote
                  </p>
                  <p className="mt-1 text-ui text-encre-2">{PHRASE}</p>
                </div>
              </div>
              <div aria-hidden="true" className="mb-4 flex justify-center">
                <MiniTicket
                  papier="beurre"
                  creneau="Petit-déj"
                  plat="Overnight oats"
                  kcal={380}
                  angle={-5}
                  petit
                />
                <MiniTicket
                  papier="menthe"
                  creneau="Midi"
                  plat="Poulet, riz"
                  kcal={520}
                  angle={3}
                  petit
                />
                <MiniTicket papier="ciel" creneau="Soir" plat="Dal" kcal={398} angle={-2} petit />
              </div>
            </>
          ) : (
            <div className="mb-3.5 flex items-center justify-between">
              <p className="text-[32px] leading-none font-extrabold tracking-[-0.035em]">Mijote</p>
              <Link
                to="/connexion"
                aria-label="Retour à la connexion"
                className="flex size-11 items-center justify-center rounded-coin border-[1.5px] border-trait bg-surface"
              >
                <ChevronLeft size={20} strokeWidth={1.9} aria-hidden="true" />
              </Link>
            </div>
          )}
        </div>
        <Vitrine />
        <div>
          <Outlet />
        </div>
        <p className="mt-4 text-mention text-encre-2 lg:hidden">{SOURCES}</p>
      </div>
    </main>
  );
}

// Petit ticket de couleur posé en biais (décoratif : les plats sont des exemples fixes)
function MiniTicket({ papier, creneau, plat, kcal, angle, petit = false }) {
  return (
    <Ticket
      papier={papier}
      style={{ transform: `rotate(${angle}deg)` }}
      className={`relative text-left leading-tight ${
        petit ? 'w-28 !px-2.5 !pt-2 !pb-2.5 not-first:-ml-1.5' : 'mt-[-26px] w-max min-w-32'
      }`}
    >
      <small className="block text-[12.5px] font-medium text-encre-2">{creneau}</small>
      <strong className={`block font-bold ${petit ? 'text-[13px]' : 'text-[15px]'}`}>{plat}</strong>
      <b
        className={`mt-0.5 block font-extrabold tracking-tight ${petit ? 'text-[17px]' : 'text-[20px]'}`}
      >
        {kcal} kcal
      </b>
    </Ticket>
  );
}

// La vitrine du PC : décorative (exemples d'assiettes), les vraies recettes sont dans l'appli.
function Vitrine() {
  return (
    <section aria-hidden="true" className="hidden lg:block">
      <p className="text-[84px] leading-none font-extrabold tracking-[-0.035em]">Mijote</p>
      <p className="mt-3.5 max-w-[30ch] text-[21px] leading-snug text-encre-2">{PHRASE}</p>
      <div className="mt-10 mb-7 flex items-start gap-7">
        <div className="flex flex-col items-start">
          <Anneau
            kcal={486}
            proteins={31}
            carbs={55}
            fats={14}
            taille={190}
            photoUrl={PHOTO_BOLOGNAISE}
            label="Bolognaise"
          />
          <MiniTicket papier="menthe" creneau="Midi" plat="Bolognaise" kcal={486} angle={-4} />
        </div>
        <div className="flex flex-col items-start">
          <Anneau
            kcal={270}
            proteins={17}
            carbs={15}
            fats={16}
            taille={150}
            photoUrl={PHOTO_SHAKSHUKA}
            label="Shakshuka"
          />
          <MiniTicket papier="beurre" creneau="Petit-déj" plat="Shakshuka" kcal={270} angle={5} />
        </div>
        <div className="flex flex-col items-start">
          <Anneau
            kcal={398}
            proteins={19}
            carbs={52}
            fats={11}
            taille={120}
            photoUrl={PHOTO_DAL}
            label="Dal aux épinards"
          />
          <MiniTicket papier="ciel" creneau="Soir" plat="Dal aux épinards" kcal={398} angle={-3} />
        </div>
      </div>
      <p className="text-[13px] text-encre-2">{SOURCES}</p>
    </section>
  );
}
