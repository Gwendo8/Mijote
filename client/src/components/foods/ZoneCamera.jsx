import { useRef } from 'react';
import { useCodeScanner } from '../../hooks/foods/useCodeScanner.js';

// Zone sombre de la caméra : cadre en tirets, ligne verte de lecture, consigne dessous.
// `consigne` : phrase affichée sous le cadre. Si la caméra n'est pas disponible, on le dit et on propose la saisie.
export default function ZoneCamera({ active, onCode, consigne, className = '' }) {
  const videoRef = useRef(null);
  const status = useCodeScanner({ active, videoRef, onCode });

  return (
    <div className={`relative overflow-hidden bg-camera text-sur-vert ${className}`}>
      <video
        ref={videoRef}
        muted
        playsInline
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover opacity-60"
      />
      <div className="relative flex h-full flex-col items-center justify-center gap-4 px-4 py-6">
        <div className="relative h-24 w-4/5 max-w-75 border-2 border-dashed border-white lg:h-20 lg:w-3/5">
          <div aria-hidden="true" className="absolute inset-x-5 top-1/2 h-0.5 bg-vert" />
        </div>
        <p role="status" className="text-center font-extrabold text-ui text-white">
          {status === 'unavailable'
            ? 'La caméra n’est pas disponible. Tape les chiffres du code-barres.'
            : consigne}
        </p>
      </div>
    </div>
  );
}
