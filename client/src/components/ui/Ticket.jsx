// Les surfaces de l'appli (DESIGN.md § 5 et § 6).
// Par défaut : une carte blanche aux coins de 26 px, sans ombre ni bordure.
// Avec `papier` (beurre, menthe, peche, ciel) : un vrai ticket de créneau, bords haut et bas dentelés,
// imprimé sur le papier de son créneau. Le texte reste en encre.
const PAPIERS = ['beurre', 'menthe', 'peche', 'ciel'];

export default function Ticket({
  children,
  aere = false,
  papier,
  className = '',
  style,
  ...props
}) {
  const padding = aere ? 'p-6' : 'px-4 py-5';
  if (papier) {
    return (
      <div
        {...props}
        style={{ '--papier': `var(--${PAPIERS.includes(papier) ? papier : 'beurre'})`, ...style }}
        className={`ticket-dente rounded-[4px] bg-(--papier) px-4 pt-4 pb-4.5 text-encre ${className}`}
      >
        {children}
      </div>
    );
  }
  return (
    <div
      {...props}
      style={style}
      className={`rounded-panneau bg-surface text-encre ${padding} ${className}`}
    >
      {children}
    </div>
  );
}

// En-tête d'un panneau : un titre, puis une ligne en encre pâle. Centré par défaut, `aGauche` pour un formulaire.
export function TicketEntete({ titre, sousTitre, as: Tag = 'h1', aGauche = false }) {
  return (
    <header className={`mb-3 ${aGauche ? '' : 'text-center'}`}>
      <Tag
        className={`font-extrabold tracking-tight ${
          Tag === 'h1' ? 'text-[24px]' : 'text-ticket-titre lg:text-ticket-titre-pc'
        }`}
      >
        {titre}
      </Tag>
      {sousTitre && <p className="mt-1 text-ui text-encre-2">{sousTitre}</p>}
    </header>
  );
}

// Trait en tirets qui sépare deux parties d'un panneau.
export function TicketTirets() {
  return <hr className="my-3 border-0 border-t-[1.5px] border-dashed border-tirets" />;
}

// Titre de partie (« Ingrédients », « Étapes ») suivi de pointillés.
export function TicketPartie({ children }) {
  return (
    <div className="my-2 flex items-center gap-2 text-ui font-bold text-encre-2">
      <span>{children}</span>
      <span aria-hidden="true" className="flex-1 border-t-2 border-dotted border-encre/25" />
    </div>
  );
}

// Une ligne : nom à gauche, pointillés, valeur alignée à droite en gras.
// `valeurDessous` : valeur longue (adresse e-mail) sur sa propre ligne, alignée à gauche sous le libellé.
export function TicketLigne({ nom, valeur, valeurDessous = false }) {
  if (valeurDessous) {
    return (
      <div className="py-1">
        <div className="flex items-baseline gap-2">
          <span className="shrink-0">{nom}</span>
          <span aria-hidden="true" className="flex-1 border-t-2 border-dotted border-encre/25" />
        </div>
        <span className="block font-bold [overflow-wrap:anywhere]">{valeur}</span>
      </div>
    );
  }
  return (
    <div className="flex flex-wrap items-baseline gap-x-2 py-1">
      <span className="shrink-0">{nom}</span>
      <span
        aria-hidden="true"
        className="min-w-4 flex-1 border-t-2 border-dotted border-encre/25"
      />
      {/* Valeur trop longue (adresse e-mail) : elle passe seule à la ligne, calée à droite */}
      <span className="ml-auto max-w-full text-right font-bold [overflow-wrap:anywhere]">
        {valeur}
      </span>
    </div>
  );
}

// Total : libellé à gauche, nombre en grand à droite.
export function TicketTotal({ libelle = 'Total', valeur }) {
  return (
    <div className="flex items-end justify-between gap-2 pt-2">
      <span className="text-ui font-bold text-encre-2">{libelle}</span>
      <span className="text-ecran font-extrabold tracking-tight lg:text-chiffre">{valeur}</span>
    </div>
  );
}
