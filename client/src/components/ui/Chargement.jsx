import Ticket from './Ticket.jsx';

// Chargement : le ticket « s'imprime », avec des lignes grises à la place du texte.
export default function Chargement({ label = 'Chargement…' }) {
  return (
    <div role="status" aria-live="polite" className="animate-imprimer">
      <span className="sr-only">{label}</span>
      <Ticket aria-hidden="true">
        <div className="mx-auto mb-4 h-5 w-1/2 bg-pointilles" />
        <div className="space-y-3">
          <div className="h-3 w-full bg-pointilles" />
          <div className="h-3 w-5/6 bg-pointilles" />
          <div className="h-3 w-2/3 bg-pointilles" />
        </div>
      </Ticket>
    </div>
  );
}
