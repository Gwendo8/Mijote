import { Link2, Plus, X } from 'lucide-react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router';
import ChampRecherche from '../../components/foods/ChampRecherche.jsx';
import EnTetePage from '../../components/layout/EnTetePage.jsx';
import FenetreImport from '../../components/recipes/FenetreImport.jsx';
import BandeauJour from '../../components/recipes/BandeauJour.jsx';
import { BarreFiltres, ColonneFiltres } from '../../components/recipes/FiltresRecettes.jsx';
import ListeRecettes from '../../components/recipes/ListeRecettes.jsx';
import FormulaireImport from '../../components/recipes/FormulaireImport.jsx';
import Bouton from '../../components/ui/Bouton.jsx';
import Chargement from '../../components/ui/Chargement.jsx';
import Confirmation from '../../components/ui/Confirmation.jsx';
import EtatVide from '../../components/ui/EtatVide.jsx';
import MessageErreur from '../../components/ui/MessageErreur.jsx';
import { useSession } from '../../hooks/auth/useSession.js';
import { useDebounced } from '../../hooks/common/useDebounced.js';
import { useIsDesktop } from '../../hooks/layout/useIsDesktop.js';
import { useSemaineEnCours } from '../../hooks/planning/useSemaineEnCours.js';
import { LIMIT, useRecipes } from '../../hooks/recipes/useRecipes.js';
import { basePath, PORTEES } from '../../utils/recipes.js';

// Liste des recettes : recherche (titre et ingrédients, sans accents), étiquettes, filtres.
// Tout vit dans l'adresse (?q=&t=2,4&s=mine&cal=500&prot=20) : le retour depuis une fiche retrouve la liste telle quelle.
// Toucher une étiquette ouvre la fiche (/recettes/:id), sur PC comme sur téléphone.
// Mode « importer » (/recettes/importer) : une fenêtre sur PC, un écran sur téléphone.
export default function RecettesPage({ mode = 'liste', kind = 'recipe' }) {
  const idee = kind === 'idea';
  const base = basePath(kind);
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
  const notice = location.state?.notice ?? '';

  const update = (next) => {
    const merged = {
      q,
      t: tagIds.join(','),
      s: scope,
      cal: maxCalories,
      prot: minProteins,
      ...next,
    };
    const clean = {};
    if (merged.q) clean.q = merged.q;
    if (merged.t) clean.t = merged.t;
    if (merged.s !== 'all') clean.s = merged.s;
    if (merged.cal) clean.cal = merged.cal;
    if (merged.prot) clean.prot = merged.prot;
    setParams(clean, { replace: true, state: location.state });
  };

  const semaine = useSemaineEnCours();
  const search = useRecipes({
    kind,
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
    navigate(`${base}/nouveau`, { state: { draft } });
  }
  function manual(url) {
    navigate(`${base}/nouveau`, { state: { sourceUrl: url } });
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

  const filters = { scope, maxCalories, minProteins, tagIds };
  const onFiltres = (changes) =>
    update({
      ...(changes.scope !== undefined && { s: changes.scope }),
      ...(changes.tagIds !== undefined && { t: changes.tagIds.join(',') }),
      ...(changes.maxCalories !== undefined && { cal: changes.maxCalories }),
      ...(changes.minProteins !== undefined && { prot: changes.minProteins }),
    });
  const champRecherche = (
    <ChampRecherche
      className="lg:w-85"
      value={q}
      onChange={(value) => update({ q: value })}
      label={idee ? 'Chercher une idée' : 'Chercher une recette'}
      placeholder={
        idee
          ? isDesktop
            ? 'Chercher une idée, un aliment'
            : 'Chercher une idée'
          : isDesktop
            ? 'Chercher une recette, un ingrédient'
            : 'Chercher une recette'
      }
    />
  );

  return (
    <div>
      <EnTetePage titre={idee ? 'Idées de plats' : 'Recettes'}>
        <div className="hidden items-center gap-3 lg:flex">
          {isDesktop && champRecherche}
          {!idee && (
            <Bouton as={Link} to="/recettes/importer" type="contour">
              <Link2 size={16} strokeWidth={1.8} aria-hidden="true" />
              Importer par lien
            </Bouton>
          )}
          <Bouton as={Link} to={`${base}/nouveau`}>
            <Plus size={18} strokeWidth={1.8} aria-hidden="true" />
            {idee ? 'Nouvelle idée' : 'Nouvelle recette'}
          </Bouton>
        </div>
      </EnTetePage>
      {idee && (
        <p className="mb-4 font-text text-lecture text-encre-2">
          Des assiettes sans étapes : des aliments et leurs grammes, les calories sont calculées.
        </p>
      )}

      {notice && (
        <div className="mb-4">
          <Confirmation>{notice}</Confirmation>
        </div>
      )}

      <div className="lg:grid lg:grid-cols-[230px_minmax(0,1fr)] lg:items-start lg:gap-7">
        {isDesktop && (
          <ColonneFiltres
            idee={idee}
            filters={filters}
            onChange={onFiltres}
            onReset={() => update({ s: 'all', t: '', cal: '', prot: '' })}
          />
        )}
        <div className="min-w-0">
          {!isDesktop && <div className="mb-3">{champRecherche}</div>}
          {!idee && <BandeauJour jour={semaine.jour} slots={semaine.slots} />}
          {!isDesktop && (
            <div className="mb-3">
              <BarreFiltres
                idee={idee}
                filters={filters}
                onChange={onFiltres}
                total={search.loading || search.error ? null : search.total}
              />
            </div>
          )}

          <div className="mb-3 flex items-center justify-between gap-3">
            <p role="status" className="text-ui text-encre-2">
              {search.loading || search.error ? ' ' : `${search.total} ${nom(idee, search.total)}`}
            </p>
            {!idee && (
              <Bouton as={Link} to="/recettes/importer" type="contour" className="lg:hidden">
                <Link2 size={16} strokeWidth={1.8} aria-hidden="true" />
                Importer par lien
              </Bouton>
            )}
          </div>

          <Resultats
            search={search}
            filtered={filtered}
            idee={idee}
            userId={user?.id}
            talons={semaine.talons}
            onCreate={() => navigate(`${base}/nouveau`)}
            onReset={() => setParams({}, { replace: true })}
          />
        </div>
      </div>

      <Link
        to={`${base}/nouveau`}
        className="fixed right-4 bottom-24 z-10 inline-flex min-h-12 items-center gap-2 rounded-coin bg-tomate px-5 font-heading text-ui font-extrabold text-sur-tomate shadow-[0_6px_16px_-6px_rgb(28_34_48/0.35)] hover:brightness-90 lg:hidden"
      >
        <Plus size={18} strokeWidth={1.8} aria-hidden="true" />
        {idee ? 'Nouvelle idée' : 'Nouvelle recette'}
      </Link>

      {!idee && mode === 'importer' && isDesktop && (
        <FenetreImport
          onClose={() => navigate('/recettes')}
          onUse={ouvrirBrouillon}
          onManual={manual}
        />
      )}
    </div>
  );
}

// « 3 idées », « 1 recette » : le nom suit le type d'écran et le nombre.
const nom = (idee, total) =>
  idee ? (total > 1 ? 'idées' : 'idée') : total > 1 ? 'recettes' : 'recette';

function Resultats({ search, filtered, idee, userId, talons, onCreate, onReset }) {
  if (search.loading)
    return <Chargement label={idee ? 'Chargement des idées…' : 'Chargement des recettes…'} />;
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
        titre={idee ? 'Aucune idée' : 'Aucune recette'}
        texte="Rien ne correspond à cette recherche. Essaie un autre mot, retire une étiquette ou un filtre."
      >
        <Bouton type="contour" onClick={onReset}>
          <X size={16} strokeWidth={1.8} aria-hidden="true" />
          Tout effacer
        </Bouton>
      </EtatVide>
    ) : (
      <EtatVide
        texte={
          idee
            ? 'Tu n’as pas encore d’idée de plat. Compose une assiette avec des aliments et leurs grammes.'
            : 'Tu n’as pas encore de recette. Écris la première, ou importe-la depuis un lien.'
        }
      >
        <Bouton onClick={onCreate}>
          <Plus size={18} strokeWidth={1.8} aria-hidden="true" />
          {idee ? 'Créer une idée' : 'Créer une recette'}
        </Bouton>
      </EtatVide>
    );
  }
  return (
    <>
      <ListeRecettes recipes={search.items} userId={userId} talons={talons} />
      {search.total > LIMIT && (
        <p className="mt-3 text-ui text-encre-2">
          {search.items.length} {idee ? 'idées affichées' : 'recettes affichées'} sur {search.total}{' '}
          : précise ta recherche pour trouver les autres.
        </p>
      )}
    </>
  );
}
