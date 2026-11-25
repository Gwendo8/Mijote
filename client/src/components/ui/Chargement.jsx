import Ticket from './Ticket.jsx';

// Chargement : formes grises à la place du contenu (anneau gris, barres grises), sans animation de lueur.
export default function Chargement({ label = 'Chargement…' }) {
  return (
    <div role="status" aria-live="polite" className="animate-fondu">
      <span className="sr-only">{label}</span>
      <Ticket aria-hidden="true">
        <div className="mx-auto mb-4 size-16 rounded-full bg-tirets" />
        <div className="space-y-3">
          <div className="h-3 w-full rounded-full bg-tirets" />
          <div className="h-3 w-5/6 rounded-full bg-tirets" />
          <div className="h-3 w-2/3 rounded-full bg-tirets" />
        </div>
      </Ticket>
    </div>
  );
}
