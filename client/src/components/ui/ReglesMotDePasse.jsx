import { Check, Minus } from 'lucide-react';

// Les règles du mot de passe (les mêmes que l'API), cochées en vert au fil de la saisie.
const REGLES = [
  { texte: '8 caractères minimum', ok: (p) => p.length >= 8 },
  { texte: 'Au moins un chiffre', ok: (p) => /\p{N}/u.test(p) },
  { texte: 'Au moins un caractère spécial (! ? - #)', ok: (p) => /[^\p{L}\p{N}]/u.test(p) },
];

export default function ReglesMotDePasse({ motDePasse }) {
  return (
    <ul aria-label="Règles du mot de passe" className="mt-2 space-y-1 text-libelle">
      {REGLES.map(({ texte, ok }) => {
        const valide = ok(motDePasse);
        const Icone = valide ? Check : Minus;
        return (
          <li
            key={texte}
            className={`flex items-center gap-2 ${valide ? 'font-bold text-tomate' : 'text-encre-2'}`}
          >
            <Icone size={14} strokeWidth={2.4} aria-hidden="true" />
            <span>{texte}</span>
            <span className="sr-only">{valide ? ' : respectée' : ' : pas encore'}</span>
          </li>
        );
      })}
    </ul>
  );
}
