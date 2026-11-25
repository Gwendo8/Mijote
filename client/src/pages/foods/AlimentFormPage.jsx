import { useState } from 'react';
import { Trash2, X } from 'lucide-react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router';
import FormulaireAliment from '../../components/foods/FormulaireAliment.jsx';
import Bouton from '../../components/ui/Bouton.jsx';
import Chargement from '../../components/ui/Chargement.jsx';
import DialogueConfirmation from '../../components/ui/DialogueConfirmation.jsx';
import Fenetre from '../../components/ui/Fenetre.jsx';
import MessageErreur from '../../components/ui/MessageErreur.jsx';
import { useFood } from '../../hooks/foods/useFood.js';
import { useCreateFood, useDeleteFood, useUpdateFood } from '../../hooks/foods/useFoodActions.js';
import { useIsDesktop } from '../../hooks/layout/useIsDesktop.js';
import AlimentsPage from './AlimentsPage.jsx';

const ARCHIVE_TEXT =
  'Si cet aliment est utilisé dans des recettes, il ne sera pas effacé : il sera rangé. Il disparaît de tes listes et des recherches, mais tes recettes gardent ses valeurs et leurs calories.';

// Création (/aliments/nouveau) et modification (/aliments/:id/modifier) d'un aliment perso.
// Téléphone : un écran avec sa croix ; PC : une fenêtre posée sur la liste des aliments (maquettes).
export default function AlimentFormPage() {
  const { id } = useParams();
  const editing = Boolean(id);
  const isDesktop = useIsDesktop();
  const navigate = useNavigate();
  const { food, loading, error } = useFood(id);
  // Arrivée depuis un scan sans résultat : le code-barres lu est déjà rempli.
  const [searchParams] = useSearchParams();
  const scannedCode = editing ? null : searchParams.get('code');
  const create = useCreateFood();
  const update = useUpdateFood(id);
  const remove = useDeleteFood(id);
  const [confirming, setConfirming] = useState(false);

  const saving = editing ? update : create;
  const titre = editing ? 'Modifier l’aliment' : 'Nouvel aliment';
  const back = editing ? `/aliments/${id}` : '/aliments';
  const close = () => navigate(back);

  async function submit(values) {
    const result = await saving.run(values);
    if (result.ok) {
      navigate(`/aliments/${result.data.id}`, { state: { notice: 'Aliment enregistré.' } });
    }
  }

  async function confirmDelete() {
    const result = await remove.run();
    if (!result.ok) return;
    const notice =
      result.data?.result === 'archived'
        ? 'Cet aliment est utilisé dans des recettes : il est rangé, plus visible dans tes listes, mais tes recettes gardent leurs calories.'
        : 'Aliment supprimé.';
    navigate('/aliments', { state: { notice } });
  }

  let contenu;
  if (editing && loading) contenu = <Chargement label="Chargement de l’aliment…" />;
  else if (editing && error) contenu = <MessageErreur>{error}</MessageErreur>;
  else if (editing && food && !food.isMine) {
    contenu = <MessageErreur>Tu ne peux modifier que tes propres aliments.</MessageErreur>;
  } else {
    contenu = (
      <>
        <FormulaireAliment
          initial={editing ? food : scannedCode ? { barcode: scannedCode } : undefined}
          pending={saving.pending}
          error={saving.error}
          fieldErrors={saving.fieldErrors}
          onSubmit={submit}
          onCancel={close}
        />
        {editing && (
          <div className="mt-6 border-t-[1.5px] border-solid border-trait pt-4">
            <Bouton type="contour" onClick={() => setConfirming(true)} className="w-full lg:w-auto">
              <Trash2 size={16} strokeWidth={1.8} aria-hidden="true" />
              Supprimer cet aliment
            </Bouton>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      {isDesktop ? (
        <>
          <AlimentsPage />
          <Fenetre titre={titre} onClose={close} large>
            {contenu}
          </Fenetre>
        </>
      ) : (
        <div>
          <header className="mb-4 flex items-center gap-3">
            <Link
              to={back}
              aria-label="Fermer sans enregistrer"
              className="flex size-10 shrink-0 items-center justify-center rounded-coin border-[1.5px] border-trait bg-fond"
            >
              <X size={20} strokeWidth={1.8} aria-hidden="true" />
            </Link>
            <h1 className="min-w-0 flex-1 text-[22px] font-extrabold">{titre}</h1>
          </header>
          {contenu}
        </div>
      )}
      {confirming && (
        <DialogueConfirmation
          titre="Supprimer l’aliment ?"
          message={ARCHIVE_TEXT}
          confirmLabel="Supprimer cet aliment"
          pending={remove.pending}
          error={remove.error}
          onConfirm={confirmDelete}
          onCancel={() => setConfirming(false)}
        />
      )}
    </>
  );
}
