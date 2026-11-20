import { Link2, Plus, X } from 'lucide-react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router';
import ChampRecherche from '../../components/foods/ChampRecherche.jsx';
import EnTetePage from '../../components/layout/EnTetePage.jsx';
import FenetreImport from '../../components/recipes/FenetreImport.jsx';
import { PanneauFiltres, PucesEtiquettes } from '../../components/recipes/FiltresRecettes.jsx';
import ListeRecettes from '../../components/recipes/ListeRecettes.jsx';
import PanneauRecette from '../../components/recipes/PanneauRecette.jsx';
import FormulaireImport from '../../components/recipes/FormulaireImport.jsx';
import Bouton from '../../components/ui/Bouton.jsx';
import Chargement from '../../components/ui/Chargement.jsx';
import Confirmation from '../../components/ui/Confirmation.jsx';
import EtatVide from '../../components/ui/EtatVide.jsx';
import MessageErreur from '../../components/ui/MessageErreur.jsx';
import { useSession } from '../../hooks/auth/useSession.js';
import { useDebounced } from '../../hooks/common/useDebounced.js';
import { useIsDesktop } from '../../hooks/layout/useIsDesktop.js';
import { LIMIT, useRecipes } from '../../hooks/recipes/useRecipes.js';
import { PORTEES } from '../../utils/recipes.js';

// Liste des recettes : recherche (titre et ingrédients, sans accents), étiquettes, filtres.
// Tout vit dans l'adresse (?q=&t=2,4&s=mine&cal=500&prot=20&r=12) : le retour depuis une fiche retrouve la liste telle quelle.
// PC : toucher une étiquette ouvre la fiche dans un panneau à droite (?r=). Téléphone : la fiche a son écran.
// Mode « importer » (/recettes/importer) : une fenêtre sur PC, un écran sur téléphone.
export default function RecettesPage({ mode = 'liste' }) {
  const isDesktop = useIsDesktop();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSession();
  const [params, setParams] = useSearchParams();

  const q = params.get('q') ?? '';
  const tagIds = (params.get('t') ?? '')
    .split(',')
    .map(Number)
    .filter((id) => Number.isInteger(id) && id > 0);
  const requested = params.get('s');
  const scope = PORTEES.some((p) => p.id === requested) ? requested : 'all';
  const maxCalories = params.get('cal') ?? '';
  const minProteins = params.get('prot') ?? '';
  const openId = isDesktop ? Number(params.get('r')) || null : null;
  const notice = location.state?.notice ?? '';

  const update = (next) => {
    const merged = {
      q,
      t: tagIds.join(','),
      s: scope,
      cal: maxCalories,
      prot: minProteins,
      r: openId ?? '',
      ...next,
    };
    const clean = {};
    if (merged.q) clean.q = merged.q;
    if (merged.t) clean.t = merged.t;
    if (merged.s !== 'all') clean.s = merged.s;
    if (merged.cal) clean.cal = merged.cal;
    if (merged.prot) clean.prot = merged.prot;
    if (merged.r) clean.r = String(merged.r);
    setParams(clean, { replace: true, state: location.state });
  };

  const search = useRecipes({
    kind: 'recipe',
    scope,
    q: useDebounced(q).trim(),
    tagIds,
    maxCalories: Number(maxCalories) > 0 ? maxCalories : undefined,
    minProteins: Number(minProteins) > 0 ? minProteins : undefined,
  });
  const filtered =
    q.trim() !== '' ||
    tagIds.length > 0 ||
    scope !== 'all' ||
    maxCalories !== '' ||
    minProteins !== '';

  function ouvrirBrouillon(draft) {
    navigate('/recettes/nouveau', { state: { draft } });
  }
  function manual(url) {
    navigate('/recettes/nouveau', { state: { sourceUrl: url } });
  }

  // Téléphone : l'import est un écran à part entière
  if (mode === 'importer' && !isDesktop) {
    return (
      <div>
        <EnTetePage titre="Importer" retour />
        <FormulaireImport onUse={ouvrirBrouillon} onManual={manual} />
      </div>
    );
  }

  return (
    <div className="lg:flex lg:items-start lg:gap-7">
      <div className="min-w-0 flex-1">
        <EnTetePage titre="Recettes">
          <div className="hidden gap-3 lg:flex">
            <Bouton as={Link} to="/recettes/importer" type="contour">
              <Link2 size={16} strokeWidth={1.8} aria-hidden="true" />
              Importer par lien
            </Bouton>
            <Bouton as={Link} to="/recettes/nouveau">
              <Plus size={18} strokeWidth={1.8} aria-hidden="true" />
              Nouvelle recette
            </Bouton>
          </div>
        </EnTetePage>

        {notice && (
          <div className="mb-4">
            <Confirmation>{notice}</Confirmation>
          </div>
        )}

        <div className="mb-4 space-y-3">
          <ChampRecherche
            className="lg:max-w-175"
            value={q}
            onChange={(value) => update({ q: value })}
            label="Chercher une recette"
            placeholder={isDesktop ? 'Chercher une recette, un ingrédient' : 'Chercher une recette'}
          />
          <PucesEtiquettes tagIds={tagIds} onChange={(ids) => update({ t: ids.join(',') })} />
          <PanneauFiltres
            filters={{ scope, maxCalories, minProteins }}
            onChange={(changes) =>
              update({
                ...(changes.scope !== undefined && { s: changes.scope }),
                ...(changes.maxCalories !== undefined && { cal: changes.maxCalories }),
                ...(changes.minProteins !== undefined && { prot: changes.minProteins }),
              })
            }
          />
        </div>

        <div className="mb-3 flex items-center justify-between gap-3">
          <p role="status" className="text-ui text-encre-2">
            {search.loading || search.error
              ? ' '
              : `${search.total} ${search.total > 1 ? 'recettes' : 'recette'}`}
          </p>
          <Bouton as={Link} to="/recettes/importer" type="contour" className="lg:hidden">
            <Link2 size={16} strokeWidth={1.8} aria-hidden="true" />
            Importer par lien
          </Bouton>
        </div>

        <Resultats
          search={search}
          filtered={filtered}
          userId={user?.id}
          openId={openId}
          onOpen={isDesktop ? (id) => update({ r: id }) : undefined}
          onCreate={() => navigate('/recettes/nouveau')}
          onReset={() => setParams({}, { replace: true })}
        />
      </div>

      {isDesktop && openId && (
        <PanneauRecette key={openId} id={openId} onClose={() => update({ r: '' })} />
      )}

      <Link
        to="/recettes/nouveau"
        className="fixed right-4 bottom-24 z-10 inline-flex min-h-12 items-center gap-2 rounded-coin bg-vert px-5 font-heading text-ui font-extrabold text-sur-vert shadow-[0_6px_0_-2px_rgb(0_0_0/0.2)] hover:brightness-90 lg:hidden"
      >
        <Plus size={18} strokeWidth={1.8} aria-hidden="true" />
        Nouvelle recette
      </Link>

      {mode === 'importer' && isDesktop && (
        <FenetreImport
          onClose={() => navigate('/recettes')}
          onUse={ouvrirBrouillon}
          onManual={manual}
        />
      )}
    </div>
  );
}

function Resultats({ search, filtered, userId, openId, onOpen, onCreate, onReset }) {
  if (search.loading) return <Chargement label="Chargement des recettes…" />;
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
  if (search.items.length === 0) {
    return filtered ? (
      <EtatVide
        titre="Aucune recette"
        texte="Rien ne correspond à cette recherche. Essaie un autre mot, retire une étiquette ou un filtre."
      >
        <Bouton type="contour" onClick={onReset}>
          <X size={16} strokeWidth={1.8} aria-hidden="true" />
          Tout effacer
        </Bouton>
      </EtatVide>
    ) : (
      <EtatVide texte="Tu n’as pas encore de recette. Écris la première, ou importe-la depuis un lien.">
        <Bouton onClick={onCreate}>
          <Plus size={18} strokeWidth={1.8} aria-hidden="true" />
          Créer une recette
        </Bouton>
      </EtatVide>
    );
  }
  return (
    <>
      <ListeRecettes
        recipes={search.items}
        userId={userId}
        onOpen={onOpen}
        selectedId={openId}
        etroite={Boolean(openId)}
      />
      {search.total > LIMIT && (
        <p className="mt-3 text-ui text-encre-2">
          {search.items.length} recettes affichées sur {search.total} : précise ta recherche pour
          trouver les autres.
        </p>
      )}
    </>
  );
}
