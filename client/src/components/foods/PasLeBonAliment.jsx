import { Plus, ScanBarcode } from 'lucide-react';
import { Link } from 'react-router';
import Bouton from '../ui/Bouton.jsx';
import MessageErreur from '../ui/MessageErreur.jsx';
import Ticket, { TicketPartie } from '../ui/Ticket.jsx';
import { libelleOff } from '../../utils/foods.js';

// Ticket « Pas le bon aliment ? » (téléphone) : chercher plus loin (Open Food Facts), scanner ou créer son aliment.
// `off` : le hook useOffSearch ; `peutChercherOff` : une recherche est écrite et le filtre le permet.
export default function PasLeBonAliment({ off, peutChercherOff, onScan }) {
  return (
    <Ticket>
      <TicketPartie>Pas le bon aliment ?</TicketPartie>
      <p className="mb-3 font-text text-lecture leading-[1.45]">
        Scanne le code-barres du produit, ou crée ton propre aliment.
      </p>
      <div className="grid grid-cols-2 gap-3">
        <Bouton type="contour" onClick={onScan}>
          <ScanBarcode size={18} strokeWidth={1.8} aria-hidden="true" />
          Scanner
        </Bouton>
        <Bouton as={Link} to="/aliments/nouveau">
          <Plus size={18} strokeWidth={1.8} aria-hidden="true" />
          Créer
        </Bouton>
      </div>
      {/* Lien discret sous les boutons, pour garder la disposition de la maquette */}
      {peutChercherOff && (
        <div className="mt-3 space-y-2">
          <button
            type="button"
            onClick={off.search}
            disabled={off.pending || off.attente > 0}
            aria-busy={off.pending || undefined}
            className="min-h-9 cursor-pointer text-libelle font-bold underline underline-offset-2 disabled:opacity-50"
          >
            {off.pending ? 'Recherche…' : libelleOff(off)}
          </button>
          <MessageErreur>{off.error}</MessageErreur>
          {off.done && !off.error && (
            <p role="status" className="font-text text-ui text-encre-2">
              {off.items.length === 0
                ? 'Open Food Facts n’a rien trouvé de plus.'
                : `Open Food Facts : ${off.items.length} produit${off.items.length > 1 ? 's' : ''} de plus dans la liste.`}
            </p>
          )}
        </div>
      )}
    </Ticket>
  );
}
