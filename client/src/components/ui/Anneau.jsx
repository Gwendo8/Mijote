import { macroShares, ringGradient } from '../../utils/macros.js';
import { formatNombre } from '../../utils/planning.js';

// L'anneau des macros : protéines, glucides, lipides, du haut dans le sens des aiguilles d'une montre
// (DESIGN.md § 6). Épaisseur 11 % du diamètre, jour de 3,5 % entre l'anneau et le centre.
// Centre : la photo ; sans photo, les calories (« 380 » puis « kcal ») ; `centre="vide"` pour un jour ou un logo.
// Calories inconnues : anneau en tirets gris et « ? ». `taille` en pixels.
// `label` : phrase lue par les lecteurs d'écran (par défaut « X kcal par part »). Sans label et en centre vide,
// l'anneau est décoratif (caché aux lecteurs d'écran).
// `anime` : l'anneau se remplit depuis le haut à l'affichage.
export default function Anneau({
  kcal = null,
  proteins,
  carbs,
  fats,
  photoUrl,
  taille = 56,
  label: customLabel,
  partages,
  centre = 'kcal',
  anime = false,
  className = '',
}) {
  // `partages` : répartition déjà calculée (listes, où l'API ne donne que les protéines)
  const shares = kcal === null ? null : (partages ?? macroShares({ proteins, carbs, fats }));
  const epaisseur = taille * 0.11;
  const jeu = taille * 0.035;
  const decoratif = centre === 'vide' && !customLabel;
  const masque = `radial-gradient(farthest-side, transparent calc(100% - ${epaisseur}px), #000 calc(100% - ${epaisseur}px + 0.5px))`;

  return (
    <div
      className={`relative shrink-0 rounded-full ${className}`}
      style={{ width: taille, height: taille }}
      {...(decoratif
        ? { 'aria-hidden': 'true' }
        : { role: 'img', 'aria-label': customLabel ?? label(kcal) })}
    >
      <div
        className={`absolute inset-0 rounded-full ${anime ? 'animate-remplir' : ''}`}
        style={{
          background: shares
            ? ringGradient(shares)
            : 'repeating-conic-gradient(var(--tirets) 0 6deg, transparent 6deg 12deg)',
          mask: masque,
          WebkitMask: masque,
        }}
      />
      <div
        className="absolute flex items-center justify-center overflow-hidden rounded-full bg-surface text-center"
        style={{ inset: epaisseur + jeu }}
      >
        {photoUrl ? (
          <img src={photoUrl} alt="" className="h-full w-full object-cover" />
        ) : centre === 'vide' ? null : (
          <div
            className="leading-none font-extrabold tracking-tight"
            style={{ fontSize: taille / (kcal !== null && kcal >= 1000 ? 5.6 : 4.4) }}
          >
            <span className="block">{kcal === null ? '?' : formatNombre(kcal)}</span>
            <span
              className="mt-0.5 block font-medium tracking-normal text-encre-2"
              style={{ fontSize: Math.max(11, taille / 12) }}
            >
              kcal
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function label(kcal) {
  return kcal === null ? 'Calories inconnues' : `${Math.round(kcal)} kcal par part`;
}
