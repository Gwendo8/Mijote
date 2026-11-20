import { useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import EnTetePage from '../../components/layout/EnTetePage.jsx';
import FormulaireRecette, { FORM_ID } from '../../components/recipes/FormulaireRecette.jsx';
import Bouton from '../../components/ui/Bouton.jsx';
import Chargement from '../../components/ui/Chargement.jsx';
import EtatVide from '../../components/ui/EtatVide.jsx';
import MessageErreur from '../../components/ui/MessageErreur.jsx';
import {
  useCreateRecipe,
  useDeletePhoto,
  useUpdateRecipe,
  useUploadPhoto,
} from '../../hooks/recipes/useRecipeActions.js';
import { useRecipe } from '../../hooks/recipes/useRecipe.js';

// Création (/recettes/nouveau) et modification (/recettes/:id/modifier) d'une recette.
// Création : peut arriver avec un brouillon d'import (state.draft) ou un lien gardé (state.sourceUrl, cas TikTok).
// La photo s'envoie après l'enregistrement (il faut l'identifiant de la recette) : si elle échoue, la recette est
// quand même enregistrée et la fiche le dit.
export default function RecetteFormPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const editing = Boolean(id);
  const { recipe, loading, error } = useRecipe(id);
  const create = useCreateRecipe();
  const update = useUpdateRecipe(id);
  const upload = useUploadPhoto();
  const removePhoto = useDeletePhoto(id);
  const [saving, setSaving] = useState(false);

  const action = editing ? update : create;
  const titre = editing ? 'Modifier la recette' : 'Nouvelle recette';
  const retour = editing ? `/recettes/${id}` : '/recettes';

  async function submit(body, photo) {
    setSaving(true);
    const result = editing ? await update.run(body) : await create.run({ kind: 'recipe', ...body });
    if (!result.ok) {
      setSaving(false);
      return;
    }
    const saved = result.data;
    let notice = editing ? 'Modifications enregistrées.' : 'Recette enregistrée.';
    if (photo.file) {
      const sent = await upload.run(saved.id, photo.file);
      if (!sent.ok)
        notice = `Recette enregistrée, mais la photo n’a pas pu être envoyée : ${sent.error?.status === 400 ? 'elle n’est pas lisible ou trop lourde.' : 'réessaie depuis « Modifier ».'}`;
    } else if (photo.removed && editing) {
      await removePhoto.run();
    }
    navigate(`/recettes/${saved.id}`, { replace: true, state: { notice } });
  }

  if (editing && loading) return <Chargement label="Chargement de la recette…" />;
  if (editing && error) {
    return (
      <div>
        <EnTetePage titre={titre} retour="fermer" />
        <MessageErreur>{error}</MessageErreur>
      </div>
    );
  }
  if (editing && recipe && !recipe.isMine) {
    return (
      <div>
        <EnTetePage titre={titre} retour="fermer" />
        <div className="max-w-md">
          <EtatVide texte="Cette recette n’est pas à toi : tu ne peux pas la modifier. Copie-la chez toi pour en faire une version à toi.">
            <Bouton as={Link} to={retour} type="contour">
              Retour à la recette
            </Bouton>
          </EtatVide>
        </div>
      </div>
    );
  }

  return (
    <div>
      <EnTetePage titre={titre} retour="fermer">
        <div className="hidden gap-3 lg:flex">
          <Bouton as={Link} to={retour} type="contour">
            Annuler
          </Bouton>
          <Bouton htmlType="submit" form={FORM_ID} pending={saving} pendingLabel="Enregistrement…">
            Enregistrer la recette
          </Bouton>
        </div>
      </EnTetePage>
      <FormulaireRecette
        key={recipe?.id ?? 'nouvelle'}
        initial={recipe}
        draft={location.state?.draft}
        sourceUrl={location.state?.sourceUrl}
        pending={saving}
        error={action.error}
        fieldErrors={action.fieldErrors}
        onSubmit={submit}
      />
    </div>
  );
}
