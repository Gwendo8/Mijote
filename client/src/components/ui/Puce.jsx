// Puce de filtre ou de choix : coins de 10 px, bord de 1,5 px. Active : fond encre, texte blanc.
export default function Puce({ actif = false, children, className = '', ...props }) {
  return (
    <button
      type="button"
      aria-pressed={actif}
      {...props}
      className={`inline-flex min-h-11 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-puce border-[1.5px] px-3 text-ui font-semibold lg:min-h-9 ${
        actif ? 'border-encre bg-encre text-surface' : 'border-trait bg-surface text-encre'
      } ${className}`}
    >
      {children}
    </button>
  );
}
