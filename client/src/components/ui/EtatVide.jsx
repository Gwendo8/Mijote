import Ticket, { TicketEntete } from './Ticket.jsx';

// État vide : un ticket vide « RIEN À ADDITIONNER », une phrase qui dit quoi faire, puis un bouton (children).
export default function EtatVide({ titre = 'Rien à additionner', texte, children }) {
  return (
    <Ticket>
      <TicketEntete titre={titre} as="h2" />
      {texte && <p className="text-center font-text text-lecture leading-[1.55]">{texte}</p>}
      {children && <div className="mt-4 flex justify-center">{children}</div>}
    </Ticket>
  );
}
