import { useState } from 'react';
import { Link2, Send } from 'lucide-react';
import { useImportRecipe } from '../../hooks/recipes/useRecipeActions.js';
import { importUrlError } from '../../schemas/recipes.js';
import {
  siteOf,
  formatMinutes,
  splitSteps,
  totalMinutes,
  formatParts,
} from '../../utils/recipes.js';
import Bouton from '../ui/Bouton.jsx';
import Champ from '../ui/Champ.jsx';
import MessageErreur from '../ui/MessageErreur.jsx';
import Tampon from '../ui/Tampon.jsx';
import Ticket, { TicketEntete, TicketLigne, TicketPartie, TicketTirets } from '../ui/Ticket.jsx';

// Import par lien : on colle l'adresse, Mijote lit la fiche de la page (rien n'est enregistré) et propose un brouillon.
// `plat` : dans une fenêtre (PC), les résultats ne sont pas posés sur un ticket de plus.
// `onUse(draft)` : « Vérifier et enregistrer » (le formulaire s'ouvre rempli) ; `onManual(url)` : créer à la main en gardant le lien.
export default function FormulaireImport({ onUse, onManual, plat = false }) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [draft, setDraft] = useState(null);
  const [failedUrl, setFailedUrl] = useState('');
  const read = useImportRecipe();

  async function submit(event) {
    event.preventDefault();
    const message = importUrlError(url);
    setError(message);
    setDraft(null);
    setFailedUrl('');
    if (message) return;
    const result = await read.run(url.trim());
    if (result.ok) setDraft(result.data);
    else if (result.error?.status === 422) setFailedUrl(url.trim());
  }

  const etapes = draft ? splitSteps(draft.instructions).length : 0;
  const temps = draft ? totalMinutes(draft) : 0;

  return (
    <div className="space-y-4">
      <p className="font-text text-lecture leading-[1.55]">
        Colle le lien d’une page de recette. Mijote lit sa fiche : titre, photo, ingrédients et
        étapes.
      </p>
      <form onSubmit={submit} noValidate className="space-y-3">
        <Champ
          label="Lien de la recette"
          name="url"
          type="url"
          icone={Link2}
          autoComplete="off"
          inputMode="url"
          placeholder="https://"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          error={error || read.fieldErrors.url}
        />
        <Bouton
          type="noir"
          htmlType="submit"
          pending={read.pending}
          pendingLabel="Lecture…"
          className="w-full lg:w-auto"
        >
          <Send size={16} strokeWidth={1.8} aria-hidden="true" />
          Lire la recette
        </Bouton>
      </form>
      {!(read.error && read.fieldErrors.url) && <MessageErreur>{read.error}</MessageErreur>}
      {failedUrl && (
        <div className="flex">
          <Bouton type="contour" onClick={() => onManual(failedUrl)}>
            Créer la recette à la main, avec ce lien
          </Bouton>
        </div>
      )}

      {draft && (
        <Bloc plat={plat}>
          <TicketEntete titre="Recette trouvée" sousTitre={siteOf(draft.sourceUrl)} as="h2" />
          <TicketTirets />
          <div className="flex items-center gap-3 py-1">
            {draft.imageUrl && (
              <Tampon taille={56} photoUrl={draft.imageUrl} label="Photo de la recette trouvée" />
            )}
            <div className="min-w-0">
              <p className="text-lecture font-extrabold [overflow-wrap:anywhere]">{draft.title}</p>
              <p className="text-libelle text-encre-2">
                {[temps > 0 ? formatMinutes(temps) : null, formatParts(draft.servings)]
                  .filter(Boolean)
                  .join(', ')}
              </p>
            </div>
          </div>
          <TicketTirets />
          <TicketLigne nom="ingrédients" valeur={draft.ingredients.length} />
          <TicketLigne nom="étapes" valeur={etapes} />
          <TicketTirets />
          <p className="mb-3 font-text text-ui text-encre-2">
            Les ingrédients ne sont pas reliés à un aliment : relie-les avant d’enregistrer pour
            avoir les calories.
          </p>
          <Bouton className="w-full" onClick={() => onUse(draft)}>
            Vérifier et enregistrer
          </Bouton>
        </Bloc>
      )}

      <Bloc plat={plat}>
        <TicketPartie>Lien TikTok ou Instagram</TicketPartie>
        <p className="font-text text-ui leading-[1.5]">
          Ces pages n’ont pas de fiche lisible. Mijote garde le lien dans la recette, et tu tapes
          les ingrédients à la main.
        </p>
      </Bloc>
    </div>
  );
}

const Bloc = ({ plat, children }) => (plat ? <div>{children}</div> : <Ticket>{children}</Ticket>);
