import { macroShares, ringGradient } from '../../utils/macros.js';

// Le tampon : anneau des macros (protéines, glucides, lipides) posé de travers, photo ou calories au centre.
// Sans photo : le centre est blanc, cerclé de vert, calories en vert (maquettes Figma).
// Calories inconnues : anneau en tirets gris et « ? ». `taille` en pixels (150 sur une fiche, 56 sur une étiquette).
// `label` : phrase lue par les lecteurs d'écran (par défaut « X kcal par part »).
export default function Tampon({
  kcal = null,
  proteins,
  carbs,
  fats,
  photoUrl,
  taille = 56,
  label: customLabel,
  partages,
}) {
  // `partages` : répartition déjà calculée (listes, où l'API ne donne que les protéines)
  const shares = kcal === null ? null : (partages ?? macroShares({ proteins, carbs, fats }));
  const style = { width: taille, height: taille };

  return (
    <div
      className="relative -rotate-[8deg]"
      style={style}
      role="img"
      aria-label={customLabel ?? label(kcal)}
    >
      {shares ? (
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: ringGradient(shares),
            mask: 'radial-gradient(circle, transparent 58%, #000 59%)',
          }}
        />
      ) : (
        <div className="absolute inset-0 rounded-full border-2 border-dashed border-pointilles" />
      )}
      <div
        className="absolute inset-[13%] overflow-hidden rounded-full"
        style={{ fontSize: taille * 0.2 }}
      >
        {photoUrl ? (
          <img src={photoUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="largeur-etroite flex h-full w-full flex-col items-center justify-center rounded-full border-[1.5px] border-vert bg-papier font-extrabold leading-none text-vert">
            <span>{kcal === null ? '?' : Math.round(kcal)}</span>
            <span className="text-[0.55em] font-bold">kcal</span>
          </div>
        )}
      </div>
    </div>
  );
}

function label(kcal) {
  return kcal === null ? 'Calories inconnues' : `${Math.round(kcal)} kcal par part`;
}
