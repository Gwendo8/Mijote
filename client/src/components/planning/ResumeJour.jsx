import { proteinOnlyShares } from '../../utils/macros.js';
import { formatNombre, jourComplet } from '../../utils/planning.js';
import Anneau from '../ui/Anneau.jsx';

// Le résumé du jour : un grand anneau (calories au centre) et sa légende. L'API ne donne que les calories et les
// protéines d'un jour : l'anneau montre la part des protéines, le reste est en gris (sans inventer glucides et lipides).
export default function ResumeJour({ day, grand = false }) {
  const kcal = day.totalCalories > 0 ? day.totalCalories : null;
  const taille = grand ? 140 : 128;
  const reste = kcal === null ? null : Math.max(0, kcal - day.totalProteins * 4);
  return (
    <section
      aria-label={`Résumé du ${jourComplet(day.date)}`}
      className="mb-3.5 flex items-center gap-4.5 rounded-panneau bg-surface p-4.5"
    >
      <Anneau
        kcal={kcal}
        partages={proteinOnlyShares(kcal, day.totalProteins)}
        taille={taille}
        centre={day.entries.length === 0 ? 'vide' : 'kcal'}
        label={
          kcal === null ? 'Aucune calorie prévue' : `${formatNombre(kcal)} kcal prévues ce jour`
        }
        anime
      />
      <div className="min-w-0 text-ui">
        <p className={`mb-2.5 font-bold ${grand ? 'text-[20px]' : 'text-lecture'}`}>
          {jourComplet(day.date)}
        </p>
        {kcal === null ? (
          <p className="text-encre-2">
            {day.entries.length === 0 ? 'Aucune calorie prévue.' : 'Calories à compléter.'}
          </p>
        ) : (
          <ul className="space-y-2">
            <li className="flex items-center gap-2">
              <i aria-hidden="true" className="size-2.5 rounded-[3px] bg-prot" />
              Protéines <b>{formatNombre(day.totalProteins)} g</b>
            </li>
            <li className="flex items-center gap-2">
              <i aria-hidden="true" className="size-2.5 rounded-[3px] bg-tirets" />
              Glucides et lipides <b>{formatNombre(reste)} kcal</b>
            </li>
          </ul>
        )}
        {day.unknownCount > 0 && (
          <p className="mt-2 text-mention text-encre-2">
            {day.unknownCount} {day.unknownCount > 1 ? 'lignes' : 'ligne'} sans calories connues,
            non {day.unknownCount > 1 ? 'comptées' : 'comptée'} dans le total.
          </p>
        )}
      </div>
    </section>
  );
}
