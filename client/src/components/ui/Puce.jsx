// Puce de filtre ou de choix : rectangle à coins de 4 px. Active : fond encre, texte papier.
export default function Puce({ actif = false, children, className = '', ...props }) {
  return (
    <button
      type="button"
      aria-pressed={actif}
      {...props}
      className={`min-h-9 cursor-pointer whitespace-nowrap rounded-coin border-[1.5px] border-encre px-3 text-libelle font-bold ${
        actif ? 'bg-encre text-papier' : 'bg-papier text-encre'
      } ${className}`}
    >
      {children}
    </button>
  );
}
