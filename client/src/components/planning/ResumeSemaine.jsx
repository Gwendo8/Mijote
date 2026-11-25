import { formatNombre, jourCourt, resumeSemaine } from '../../utils/planning.js';

// « La semaine » : une barre par jour (le jour choisi en tomate), puis une phrase de bilan.
// Les lignes sans calories ne sont pas comptées, et on le dit.
export default function ResumeSemaine({ week, selected }) {
  const resume = resumeSemaine(week);
  const max = Math.max(...week.days.map((day) => day.totalCalories || 0));
  return (
    <section aria-labelledby="resume-semaine" className="rounded-panneau bg-surface p-3.5 text-ui">
      <h2 id="resume-semaine" className="mb-2.5 text-lecture font-extrabold">
        La semaine
      </h2>
      <div aria-hidden="true" className="mb-3 grid h-30 grid-cols-7 items-end gap-2">
        {week.days.map((day) => (
          <div
            key={day.date}
            className="flex h-full flex-col items-center justify-end gap-1.5 text-mention text-encre-2"
          >
            <i
              className={`w-full rounded-lg ${day.date === selected ? 'bg-tomate' : 'bg-tirets'}`}
              style={{
                height: `${day.totalCalories > 0 && max > 0 ? (day.totalCalories / max) * 90 : 4}%`,
              }}
            />
            {jourCourt(day.date).slice(0, 3)}
          </div>
        ))}
      </div>
      {resume.joursRemplis === 0 ? (
        <p className="font-text text-ui">Rien de prévu cette semaine.</p>
      ) : (
        <p className="font-text text-ui leading-normal">
          {formatNombre(resume.calories)} kcal prévues sur {resume.joursRemplis}{' '}
          {resume.joursRemplis > 1 ? 'jours' : 'jour'}, soit {formatNombre(resume.moyenne)} en
          moyenne, dont {formatNombre(resume.proteins)} g de protéines.
          {resume.inconnues > 0 &&
            ` ${resume.inconnues} ${resume.inconnues > 1 ? 'lignes' : 'ligne'} sans calories connues non ${resume.inconnues > 1 ? 'comptées' : 'comptée'}.`}
        </p>
      )}
    </section>
  );
}
