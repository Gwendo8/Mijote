// Le ticket de caisse : papier blanc aux bords dentelés. Tout ce qui s'additionne est posé dessus.
// Le texte d'un ticket est toujours en encre.
export default function Ticket({ children, aere = false, className = '', ...props }) {
  return (
    <div className="ombre-ticket">
      <div
        {...props}
        className={`ticket-dente bg-papier text-encre ${aere ? 'px-5.5 py-6' : 'px-4 py-6'} ${className}`}
      >
        {children}
      </div>
    </div>
  );
}

// En-tête centré : une mention en grand (MIJOTE, nom de la recette), puis une ligne en encre pâle.
export function TicketEntete({ titre, sousTitre, as: Tag = 'h1' }) {
  return (
    <header className="mb-3 text-center">
      <Tag className="largeur-large text-ticket-titre font-extrabold uppercase lg:text-ticket-titre-pc">
        {titre}
      </Tag>
      {sousTitre && <p className="mt-1 text-libelle text-encre-2">{sousTitre}</p>}
    </header>
  );
}

// Trait en tirets qui sépare deux parties d'un ticket.
export function TicketTirets() {
  return <hr className="my-3 border-0 border-t-[1.5px] border-dashed border-encre" />;
}

// Mention de partie (« PETIT-DÉJ », « ÉTAPES ») suivie de pointillés.
export function TicketPartie({ children }) {
  return (
    <div className="my-2 flex items-center gap-2 text-mention font-extrabold uppercase tracking-[0.06em] text-encre-2">
      <span>{children}</span>
      <span aria-hidden="true" className="flex-1 border-t-2 border-dotted border-pointilles" />
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
          <span aria-hidden="true" className="flex-1 border-t-2 border-dotted border-pointilles" />
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
        className="min-w-4 flex-1 border-t-2 border-dotted border-pointilles"
      />
      {/* Valeur trop longue (adresse e-mail) : elle passe seule à la ligne, calée à droite */}
      <span className="ml-auto max-w-full text-right font-bold [overflow-wrap:anywhere]">
        {valeur}
      </span>
    </div>
  );
}

// Total : « TOTAL » à gauche, nombre en grand, souligné deux fois.
export function TicketTotal({ libelle = 'Total', valeur }) {
  return (
    <div className="flex items-end justify-between gap-2 pt-2">
      <span className="text-mention font-extrabold uppercase tracking-[0.06em]">{libelle}</span>
      <span className="largeur-etroite border-b-[5px] border-double border-encre text-ecran font-extrabold lg:text-chiffre">
        {valeur}
      </span>
    </div>
  );
}
