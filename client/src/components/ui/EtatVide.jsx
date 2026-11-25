import Ticket, { TicketEntete } from './Ticket.jsx';

// État vide : un anneau en tirets, une phrase qui dit quoi faire, puis un bouton (children).
export default function EtatVide({ titre = 'Rien pour l’instant', texte, children }) {
  return (
    <Ticket>
      <div
        aria-hidden="true"
        className="mx-auto mb-3 size-16 rounded-full border-2 border-dashed border-tirets"
      />
      <TicketEntete titre={titre} as="h2" />
      {texte && <p className="text-center font-text text-lecture leading-normal">{texte}</p>}
      {children && <div className="mt-4 flex justify-center">{children}</div>}
    </Ticket>
  );
}
