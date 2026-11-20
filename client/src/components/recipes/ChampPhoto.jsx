import { useRef } from 'react';
import { Camera, ImageUp } from 'lucide-react';
import Bouton from '../ui/Bouton.jsx';
import MessageErreur from '../ui/MessageErreur.jsx';
import Tampon from '../ui/Tampon.jsx';

const ACCEPT = 'image/jpeg,image/png,image/webp';

// Photo de la recette, dans le tampon : « Prendre une photo » (appareil du téléphone) ou « Choisir une image ».
// `accept` limité à JPEG, PNG et WebP : Safari convertit alors les photos d'iPhone (HEIC) tout seul.
// Le fichier n'est envoyé qu'à l'enregistrement : ici on le garde et on montre un aperçu.
export default function ChampPhoto({ apercu, kcal = null, onPick, onRemove, error }) {
  const camera = useRef(null);
  const galerie = useRef(null);

  function picked(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file) onPick(file);
  }

  return (
    <div>
      <div className="flex items-center gap-3 lg:items-start">
        <Tampon
          taille={100}
          kcal={kcal}
          photoUrl={apercu}
          label={apercu ? 'Photo de la recette' : 'Pas de photo'}
        />
        <div className="flex flex-col items-start gap-2">
          <Bouton type="contour" className="min-h-10! px-3" onClick={() => camera.current.click()}>
            <Camera size={16} strokeWidth={1.8} aria-hidden="true" />
            <span className="lg:hidden">Prendre une photo</span>
            <span className="hidden lg:inline">
              {apercu ? 'Changer la photo' : 'Ajouter une photo'}
            </span>
          </Bouton>
          <Bouton
            type="contour"
            className="min-h-10! px-3 lg:hidden"
            onClick={() => galerie.current.click()}
          >
            <ImageUp size={16} strokeWidth={1.8} aria-hidden="true" />
            Choisir une image
          </Bouton>
          {apercu && (
            <Bouton type="contour" className="min-h-10! px-3" onClick={onRemove}>
              Retirer
            </Bouton>
          )}
        </div>
      </div>
      {/* Deux champs cachés : l'un ouvre l'appareil photo (capture), l'autre la galerie */}
      <input
        ref={camera}
        type="file"
        accept={ACCEPT}
        capture="environment"
        className="hidden"
        onChange={picked}
        tabIndex={-1}
        aria-hidden="true"
        data-testid="photo-camera"
      />
      <input
        ref={galerie}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={picked}
        tabIndex={-1}
        aria-hidden="true"
        data-testid="photo-galerie"
      />
      <div className="mt-2">
        <MessageErreur>{error}</MessageErreur>
      </div>
    </div>
  );
}
