import { macroShares, proteinOnlyShares } from '../../utils/macros.js';
import Tampon from './Tampon.jsx';

// Étiquette de marché (recettes et idées) : papier kraft si la recette a une photo, sinon papier.
// Tampon à gauche, « prix » (calories par part) à droite, puis titre, durée et parts.
// `nutrition` : l'objet renvoyé par l'API ({ caloriesPerServing, proteinsPerServing, perServing }).
// Anneau : protéines, glucides et lipides de `perServing` (ou de `macros`) ; s'ils sont tous à 0
// (recette sans aliment relié, calories saisies à la main), seulement la part des protéines.
export default function Etiquette({
  titre,
  detail,
  nutrition,
  photoUrl,
  kraft = Boolean(photoUrl),
  macros = {},
  ...props
}) {
  const kcal = nutrition?.caloriesPerServing ?? null;
  const proteins = nutrition?.proteinsPerServing ?? null;
  const partages =
    macroShares(nutrition?.perServing ?? macros) ?? proteinOnlyShares(kcal, proteins);

  return (
    <article
      {...props}
      className={`etiquette-fleche relative h-full min-h-32 py-4 pr-4 pl-6 ${
        kraft ? 'bg-kraft text-encre' : 'bg-papier text-encre'
      }`}
    >
      <span
        aria-hidden="true"
        className="absolute top-1/2 left-2.5 size-[9px] -translate-y-1/2 rounded-full bg-comptoir"
      />
      <div className="flex items-center gap-2">
        <Tampon kcal={kcal} photoUrl={photoUrl} partages={partages} />
        {kcal === null ? (
          <p className="border-[1.5px] border-dashed border-pointilles px-1.5 py-1 text-ui font-bold whitespace-nowrap">
            kcal ?
          </p>
        ) : (
          <p className="largeur-etroite text-center leading-tight">
            <span className="block text-ecran font-extrabold">{Math.round(kcal)}</span>
            <span className="block text-mention">kcal/part</span>
            {proteins !== null && (
              <span className="block text-mention font-bold text-prot-texte">
                {Math.round(proteins)} g prot.
              </span>
            )}
          </p>
        )}
      </div>
      <h2 className="mt-3 text-ui font-extrabold">{titre}</h2>
      {detail && (
        <p className={`mt-1 text-mention ${kraft ? 'text-kraft-texte-2' : 'text-encre-2'}`}>
          {detail}
        </p>
      )}
    </article>
  );
}
