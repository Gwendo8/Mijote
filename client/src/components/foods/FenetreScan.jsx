import { useState } from 'react';
import { X } from 'lucide-react';
import { Link } from 'react-router';
import { useBarcodeLookup } from '../../hooks/foods/useFoodActions.js';
import { useIsDesktop } from '../../hooks/layout/useIsDesktop.js';
import { cleanBarcode, isBarcode } from '../../utils/foods.js';
import Bouton from '../ui/Bouton.jsx';
import Champ from '../ui/Champ.jsx';
import Fenetre from '../ui/Fenetre.jsx';
import MessageErreur from '../ui/MessageErreur.jsx';
import ProduitTrouve from './ProduitTrouve.jsx';
import ZoneCamera from './ZoneCamera.jsx';

// Bord haut dentelé seulement (le bas du ticket sort de l'écran).
const SEUIL_DENTE =
  'radial-gradient(circle at 6px 0, transparent 5px, #000 5.5px) top / 12px 51% repeat-x, linear-gradient(#000 0 0) bottom / 100% 51% no-repeat';

// Scan du code-barres. Téléphone : plein écran, caméra en haut et ticket en bas ; PC : fenêtre centrée.
// Toujours possible : taper le numéro à la main (pas de caméra, pas de HTTPS…).
// `onUse(aliment)` : action du bouton « Utiliser cet aliment » (la page décide : ouvrir la fiche, ajouter à une recette…).
// `onCode(code)` : lecture seule du numéro (formulaire d'aliment) ; on ne cherche alors pas le produit.
export default function FenetreScan({ onClose, onUse, onCode }) {
  const isDesktop = useIsDesktop();
  const lookup = useBarcodeLookup();
  const [typed, setTyped] = useState('');
  const [typedError, setTypedError] = useState('');
  const [food, setFood] = useState(null);
  const [notFound, setNotFound] = useState(null);
  const [error, setError] = useState(null);

  async function search(rawCode) {
    const code = cleanBarcode(rawCode);
    setFood(null);
    setNotFound(null);
    setError(null);
    if (!isBarcode(code)) {
      return setTypedError('Le code-barres contient 8 à 14 chiffres');
    }
    setTypedError('');
    if (onCode) return onCode(code);
    setTyped(code);
    const result = await lookup.run(code);
    if (result.ok) return setFood(result.data);
    if (result.error?.status === 404) return setNotFound(code);
    if (result.error?.status === 429) {
      return setError('Trop de produits cherchés à la suite. Patiente une minute, puis réessaie.');
    }
    // 502 et autres : la phrase vient de getErrorMessage (dans lookup.error)
    setError(true);
  }

  const message = error === true ? lookup.error : error;
  const cameraOn = !food && !lookup.pending && !notFound;
  const consigne = isDesktop
    ? 'Montre le code-barres à la caméra de l’ordinateur'
    : 'Place le code-barres dans le cadre';

  const saisie = (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        search(typed);
      }}
    >
      <p className="mb-2 font-text text-ui">
        Pas de caméra ? Tape les chiffres sous le code-barres.
      </p>
      <div className="flex items-start gap-2">
        <Champ
          label="Code-barres"
          name="barcode"
          inputMode="numeric"
          autoComplete="off"
          value={typed}
          onChange={(event) => setTyped(event.target.value)}
          error={typedError}
          className="min-w-0 flex-1"
        />
        <Bouton
          type="noir"
          htmlType="submit"
          pending={lookup.pending}
          pendingLabel="Recherche…"
          className="mt-6"
        >
          Chercher
        </Bouton>
      </div>
    </form>
  );

  const resultat = (
    <>
      {message && (
        <div className="mt-3">
          <MessageErreur>{message}</MessageErreur>
        </div>
      )}
      {notFound && (
        <div className="mt-3 space-y-3">
          <p role="status" className="font-text text-lecture">
            Ce produit n’est pas chez Open Food Facts. Tu peux l’ajouter à la main.
          </p>
          <Bouton
            as={Link}
            to={`/aliments/nouveau?code=${notFound}`}
            onClick={onClose}
            type="contour"
          >
            Créer cet aliment
          </Bouton>
        </div>
      )}
      {food && (
        <div className="mt-3 space-y-4">
          <ProduitTrouve food={food} compact={isDesktop} />
          <Bouton onClick={() => onUse(food)} className="w-full">
            Utiliser cet aliment
          </Bouton>
          <Bouton type="contour" onClick={() => setFood(null)} className="w-full">
            Scanner un autre produit
          </Bouton>
        </div>
      )}
    </>
  );

  if (isDesktop) {
    return (
      <Fenetre titre="Scanner un code-barres" onClose={onClose} large>
        <ZoneCamera active={cameraOn} onCode={search} consigne={consigne} className="mb-3 h-44" />
        {saisie}
        <hr className="my-3 border-0 border-t-[1.5px] border-dashed border-encre" />
        {resultat}
      </Fenetre>
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Scanner un code-barres"
      className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-camera text-encre"
      onKeyDown={(event) => event.key === 'Escape' && onClose()}
    >
      <div className="relative shrink-0">
        <ZoneCamera
          active={cameraOn}
          onCode={search}
          consigne={consigne}
          className="min-h-88 pt-16"
        />
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer le scan"
          className="absolute top-4 left-4 flex size-10 cursor-pointer items-center justify-center rounded-coin border-[1.5px] border-white text-white"
        >
          <X size={20} strokeWidth={1.8} aria-hidden="true" />
        </button>
      </div>
      <div className="-mt-1 flex-1 bg-papier px-4 pt-6 pb-8" style={{ mask: SEUIL_DENTE }}>
        {food ? null : saisie}
        {resultat}
      </div>
    </div>
  );
}
