import { useEffect, useRef, useState } from 'react';
import { Plus, ScanBarcode } from 'lucide-react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router';
import ChampRecherche from '../../components/foods/ChampRecherche.jsx';
import FenetreScan from '../../components/foods/FenetreScan.jsx';
import FiltresAliments from '../../components/foods/FiltresAliments.jsx';
import { ListeAlimentsTicket, TableauAliments } from '../../components/foods/ListeAliments.jsx';
import PasLeBonAliment from '../../components/foods/PasLeBonAliment.jsx';
import EnTetePage from '../../components/layout/EnTetePage.jsx';
import Bouton from '../../components/ui/Bouton.jsx';
import Chargement from '../../components/ui/Chargement.jsx';
import Confirmation from '../../components/ui/Confirmation.jsx';
import EtatVide from '../../components/ui/EtatVide.jsx';
import MessageErreur from '../../components/ui/MessageErreur.jsx';
import { useDebounced } from '../../hooks/common/useDebounced.js';
import { useOffSearch } from '../../hooks/foods/useFoodActions.js';
import { libelleOff } from '../../utils/foods.js';
import { MIN_LENGTH, useFoodSearch } from '../../hooks/foods/useFoodSearch.js';
import { useIsDesktop } from '../../hooks/layout/useIsDesktop.js';
import { FILTRES } from '../../utils/foods.js';

const SOURCES_TEXT = 'Données : Ciqual (ANSES), Open Food Facts, USDA FoodData Central';

// Aliments : recherche (Ciqual, produits Open Food Facts, mes aliments), valeurs pour 100 g, scan du code-barres.
// La recherche et le filtre vivent dans l'adresse (?q=skyr&f=ciqual) : le retour depuis une fiche les retrouve.
// En dessous de ce nombre de résultats dans la base, on cherche aussi chez Open Food Facts.
const AUTO_OFF_SOUS = 3;

export default function AlimentsPage() {
  const isDesktop = useIsDesktop();
  const navigate = useNavigate();
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const [scanning, setScanning] = useState(false);

  const q = params.get('q') ?? '';
  const requested = params.get('f');
  const filter = FILTRES.some((f) => f.id === requested) ? requested : 'all';
  const update = (next) => {
    const merged = { q, f: filter, ...next };
    const clean = {};
    if (merged.q) clean.q = merged.q;
    if (merged.f !== 'all') clean.f = merged.f;
    setParams(clean, { replace: true, state: location.state });
  };

  const search = useFoodSearch(useDebounced(q), filter);
  const off = useOffSearch(q);
  const term = q.trim();
  const canSearchOff = term.length >= MIN_LENGTH && (filter === 'all' || filter === 'off');

  // Recherche Open Food Facts automatique (choix de l'utilisatrice) : seulement quand la base trouve
  // moins de 3 aliments, une fois la frappe finie, et une seule fois par recherche. Open Food Facts limite
  // les appels (10 recherches par minute pour tout le serveur) : le reste du temps, le lien suffit.
  const calme = useDebounced(q, 800).trim();
  const tentee = useRef(null);
  const { search: lancerOff } = off;
  const peu = search.items.length < AUTO_OFF_SOUS;
  const pret =
    canSearchOff &&
    calme === term &&
    !search.loading &&
    !search.error &&
    !search.idle &&
    off.attente === 0;
  useEffect(() => {
    if (!pret || !peu || tentee.current === term) return;
    tentee.current = term;
    lancerOff();
  }, [pret, peu, term, lancerOff]);

  // Les produits venus d'Open Food Facts s'ajoutent à la liste (sans doublon)
  const known = new Set(search.items.map((food) => food.id));
  const items = canSearchOff
    ? [...search.items, ...off.items.filter((food) => !known.has(food.id))]
    : search.items;

  const boutonScan = (
    <Bouton type="contour" onClick={() => setScanning(true)}>
      <ScanBarcode size={18} strokeWidth={1.8} aria-hidden="true" />
      Scanner un code-barres
    </Bouton>
  );

  return (
    <div>
      <EnTetePage titre="Aliments">
        <div className="hidden gap-3 lg:flex">
          {boutonScan}
          <Bouton as={Link} to="/aliments/nouveau">
            <Plus size={18} strokeWidth={1.8} aria-hidden="true" />
            Nouvel aliment
          </Bouton>
        </div>
      </EnTetePage>

      {location.state?.notice && (
        <div className="mb-4">
          <Confirmation>{location.state.notice}</Confirmation>
        </div>
      )}

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex gap-2 lg:w-115">
          <ChampRecherche
            className="min-w-0 flex-1"
            value={q}
            onChange={(value) => update({ q: value })}
          />
          <button
            type="button"
            onClick={() => setScanning(true)}
            aria-label="Scanner un code-barres"
            className="flex size-12 shrink-0 cursor-pointer items-center justify-center rounded-coin bg-encre text-papier lg:hidden"
          >
            <ScanBarcode size={20} strokeWidth={1.8} aria-hidden="true" />
          </button>
        </div>
        <FiltresAliments value={filter} onChange={(value) => update({ f: value })} />
      </div>

      <Resultats
        search={search}
        items={items}
        filter={filter}
        isDesktop={isDesktop}
        onCreate={() => navigate('/aliments/nouveau')}
      />

      <div className="mt-4 space-y-3">
        {(isDesktop ? false : !search.loading) && (
          <PasLeBonAliment
            off={off}
            peutChercherOff={canSearchOff}
            onScan={() => setScanning(true)}
          />
        )}
        {isDesktop && canSearchOff && !search.loading && (
          <div className="max-w-115 space-y-2">
            <Bouton
              type="contour"
              pending={off.pending}
              pendingLabel="Recherche…"
              onClick={off.search}
              disabled={off.attente > 0}
            >
              {libelleOff(off)}
            </Bouton>
            <MessageErreur>{off.error}</MessageErreur>
            {off.done && !off.error && (
              <p role="status" className="font-text text-ui text-encre-2">
                {off.items.length === 0
                  ? 'Open Food Facts n’a rien trouvé de plus.'
                  : `Open Food Facts : ${off.items.length} produits de plus dans la liste.`}
              </p>
            )}
          </div>
        )}
        <p className="text-mention text-encre-2">
          {isDesktop ? `Valeurs pour 100 g. ${SOURCES_TEXT}.` : SOURCES_TEXT}
        </p>
      </div>

      {scanning && (
        <FenetreScan
          onClose={() => setScanning(false)}
          onUse={(food) => navigate(`/aliments/${food.id}`)}
        />
      )}
    </div>
  );
}

function Resultats({ search, items, filter, isDesktop, onCreate }) {
  if (search.idle && !search.mine) {
    return (
      <EtatVide
        titre="Cherche un aliment"
        texte="Tape au moins 2 lettres. La recherche ne tient pas compte des accents ni des majuscules."
      />
    );
  }
  if (search.loading) return <Chargement label="Recherche en cours…" />;
  if (search.error) {
    return (
      <div className="space-y-3">
        <MessageErreur>{search.error}</MessageErreur>
        <Bouton type="contour" onClick={search.reload}>
          Réessayer
        </Bouton>
      </div>
    );
  }
  if (items.length === 0) {
    return search.mine ? (
      <EtatVide texte="Tu n’as pas encore créé d’aliment. Ajoute celui que tu ne trouves nulle part ailleurs.">
        <Bouton onClick={onCreate}>
          <Plus size={18} strokeWidth={1.8} aria-hidden="true" />
          Créer un aliment
        </Bouton>
      </EtatVide>
    ) : (
      <EtatVide
        titre="Aucun résultat"
        texte={
          filter === 'all'
            ? 'Rien ne correspond à cette recherche. Essaie un autre mot, cherche chez Open Food Facts ou crée ton aliment.'
            : 'Rien ne correspond dans cette liste. Essaie l’onglet « Tout », ou crée ton aliment.'
        }
      />
    );
  }
  return (
    <>
      {isDesktop ? <TableauAliments foods={items} /> : <ListeAlimentsTicket foods={items} />}
      {search.total > items.length && !search.mine && (
        <p className="mt-2 text-ui text-encre-2">
          {items.length} aliments affichés sur {search.total} : précise ta recherche pour les
          trouver.
        </p>
      )}
    </>
  );
}
