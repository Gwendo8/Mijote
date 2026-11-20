import { macroShares, ringGradient } from '../../utils/macros.js';

// Le tampon : anneau des macros (protéines, glucides, lipides) posé de travers, photo ou calories au centre.
// Calories inconnues : anneau en tirets gris et « ? ». `taille` en pixels (150 sur une fiche, 56 sur une étiquette).
export default function Tampon({ kcal = null, proteins, carbs, fats, photoUrl, taille = 56 }) {
  const shares = kcal === null ? null : macroShares({ proteins, carbs, fats });
  const style = { width: taille, height: taille };

  return (
    <div className="relative -rotate-[8deg]" style={style} role="img" aria-label={label(kcal)}>
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
          <div className="largeur-etroite flex h-full w-full flex-col items-center justify-center rounded-full bg-vert font-extrabold leading-none text-sur-vert">
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
