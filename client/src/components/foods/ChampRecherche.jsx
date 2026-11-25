import { Search } from 'lucide-react';

// Champ de recherche d'aliment : loupe à gauche, bord vert quand il est actif (maquettes).
export default function ChampRecherche({
  value,
  onChange,
  label = 'Chercher un aliment',
  placeholder = 'Chercher un aliment',
  className = '',
  ...props
}) {
  return (
    <div className={`relative ${className}`}>
      <Search
        size={18}
        strokeWidth={1.8}
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-encre-2"
      />
      <input
        type="search"
        aria-label={label}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete="off"
        {...props}
        className="min-h-12 w-full rounded-coin border-[1.5px] border-trait bg-surface pr-3 pl-10 font-heading text-lecture text-encre focus:border-2 focus:border-focus lg:text-ui"
      />
    </div>
  );
}
