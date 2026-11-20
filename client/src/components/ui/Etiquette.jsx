import Tampon from './Tampon.jsx';

// Étiquette de marché (recettes et idées) : papier kraft si la recette a une photo, sinon papier.
// Tampon à gauche, « prix » (calories par part) à droite, puis titre, durée et parts.
// `nutrition` : l'objet renvoyé par l'API ({ caloriesPerServing, proteinsPerServing }).
export default function Etiquette({ titre, detail, nutrition, photoUrl, macros = {}, ...props }) {
  const kcal = nutrition?.caloriesPerServing ?? null;
  const proteins = nutrition?.proteinsPerServing ?? null;

  return (
    <article
      {...props}
      className={`etiquette-fleche relative h-full min-h-32 py-4 pr-4 pl-6 ${
        photoUrl ? 'bg-kraft text-encre' : 'bg-papier text-encre'
      }`}
    >
      <span
        aria-hidden="true"
        className="absolute top-1/2 left-2.5 size-[9px] -translate-y-1/2 rounded-full bg-comptoir"
      />
      <div className="flex items-center gap-2">
        <Tampon kcal={kcal} photoUrl={photoUrl} {...macros} />
        {kcal === null ? (
          <p className="border-[1.5px] border-dashed border-pointilles px-2 py-1 text-ui font-bold">
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
      <h3 className="mt-3 text-ui font-extrabold">{titre}</h3>
      {detail && (
        <p className={`mt-1 text-mention ${photoUrl ? 'text-kraft-texte-2' : 'text-encre-2'}`}>
          {detail}
        </p>
      )}
    </article>
  );
}
