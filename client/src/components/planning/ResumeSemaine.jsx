import { formatNombre, resumeSemaine } from '../../utils/planning.js';

// « SEMAINE : 7144 kcal prévues sur 5 jours, soit 1429 en moyenne. » Les lignes sans calories ne sont pas comptées, et on le dit.
export default function ResumeSemaine({ week }) {
  const resume = resumeSemaine(week);
  return (
    <section aria-labelledby="resume-semaine" className="bg-papier p-3.5 text-ui">
      <h2 id="resume-semaine" className="mb-1.5 text-libelle font-extrabold uppercase">
        Semaine
      </h2>
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
