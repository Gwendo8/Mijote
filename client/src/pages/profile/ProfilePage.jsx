import { useState } from 'react';
import { ChevronRight, Lock, LogOut, Pencil } from 'lucide-react';
import { Link } from 'react-router';
import EnTetePage from '../../components/layout/EnTetePage.jsx';
import Bouton from '../../components/ui/Bouton.jsx';
import Confirmation from '../../components/ui/Confirmation.jsx';
import Fenetre from '../../components/ui/Fenetre.jsx';
import MessageErreur from '../../components/ui/MessageErreur.jsx';
import Puce from '../../components/ui/Puce.jsx';
import Ticket, {
  TicketEntete,
  TicketLigne,
  TicketPartie,
  TicketTirets,
} from '../../components/ui/Ticket.jsx';
import { useLogout } from '../../hooks/auth/useLogout.js';
import { useSession } from '../../hooks/auth/useSession.js';
import { useIsDesktop } from '../../hooks/layout/useIsDesktop.js';
import { useTheme } from '../../hooks/theme/useTheme.js';
import { firstNameOf } from '../../utils/names.js';
import DeleteAccount from './DeleteAccount.jsx';
import InfosForm from './InfosForm.jsx';
import PasswordForm from './PasswordForm.jsx';

const THEME_LABELS = { auto: 'Automatique', light: 'Clair', dark: 'Sombre' };
const THEME_AIDE = {
  auto: 'Automatique : suit le réglage de ton appareil.',
  light: 'Clair : fond clair en toute circonstance.',
  dark: 'Sombre : fond sombre en toute circonstance.',
};

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

// Mon compte. Téléphone : un ticket récapitulatif, les formulaires s'ouvrent dans une fenêtre.
// PC : les formulaires sont posés dans le ticket, et le reste (affichage, déconnexion, suppression) à côté.
export default function ProfilePage() {
  const { user } = useSession();
  const isDesktop = useIsDesktop();
  const [fenetre, setFenetre] = useState(null);
  const [notice, setNotice] = useState('');
  const nomManquant = !user.lastName?.trim();

  function saved(message) {
    setNotice(message);
    setFenetre(null);
  }

  return (
    <div>
      <EnTetePage titre="Mon compte" retour />
      {notice && (
        <div className="mb-4">
          <Confirmation>{notice}</Confirmation>
        </div>
      )}
      {isDesktop ? (
        <div className="grid grid-cols-[minmax(0,1fr)_400px] items-start gap-6">
          <Ticket aere>
            <TicketEntete
              titre={firstNameOf(user)}
              sousTitre={`compte créé le ${formatDate(user.createdAt)}`}
              as="h2"
            />
            <TicketTirets />
            {nomManquant && (
              <p className="mt-3 font-text text-ui text-encre-2">
                Ton nom manque : ajoute-le ci-dessous, il s’affiche aux personnes avec qui tu
                partages.
              </p>
            )}
            <div className="mt-4">
              <InfosForm enLigne onSaved={saved} />
            </div>
            <TicketTirets />
            <TicketPartie>Mot de passe</TicketPartie>
            <PasswordForm enLigne onSaved={saved} />
          </Ticket>
          <div className="space-y-4">
            <ThemeTicket />
            <Deconnexion />
            <DeleteAccount />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <Ticket aere>
            <TicketEntete titre={firstNameOf(user)} sousTitre={user.email} as="h2" />
            <TicketTirets />
            <div className="text-lecture">
              <TicketLigne nom="prénom" valeur={user.firstName} />
              <TicketLigne nom="nom" valeur={nomManquant ? '—' : user.lastName} />
              <TicketLigne nom="e-mail" valeur={user.email} valeurDessous />
              <TicketLigne nom="compte créé le" valeur={formatDate(user.createdAt)} />
            </div>
            {nomManquant && (
              <p className="mt-2 font-text text-ui text-encre-2">
                Ton nom manque :{' '}
                <button
                  type="button"
                  onClick={() => setFenetre('infos')}
                  className="cursor-pointer font-bold underline"
                >
                  complète-le
                </button>
                , il s’affiche aux personnes avec qui tu partages.
              </p>
            )}
            <TicketTirets />
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Bouton type="contour" onClick={() => setFenetre('infos')} className="px-3!">
                <Pencil size={16} strokeWidth={1.8} aria-hidden="true" />
                Modifier
              </Bouton>
              <Bouton type="contour" onClick={() => setFenetre('mot-de-passe')} className="px-3!">
                <Lock size={16} strokeWidth={1.8} aria-hidden="true" />
                Mot de passe
              </Bouton>
            </div>
          </Ticket>
          <ThemeTicket avecLiens isAdmin={user.role === 'admin'} />
          <Deconnexion />
          <DeleteAccount />
        </div>
      )}
      {/* Commit et heure de construction : pour vérifier qu'un téléphone a bien la dernière mise à jour */}
      <p className="mt-6 font-text text-ui text-encre-2">
        Version {import.meta.env.VITE_APP_VERSION}
      </p>
      {fenetre === 'infos' && (
        <Fenetre titre="Modifier mes infos" onClose={() => setFenetre(null)}>
          <InfosForm onSaved={saved} />
        </Fenetre>
      )}
      {fenetre === 'mot-de-passe' && (
        <Fenetre titre="Changer le mot de passe" onClose={() => setFenetre(null)}>
          <PasswordForm onSaved={saved} />
        </Fenetre>
      )}
    </div>
  );
}

// Ticket « Affichage » (thème clair, sombre ou automatique) ; sur téléphone, suivi des liens utiles.
function ThemeTicket({ avecLiens = false, isAdmin = false }) {
  const [theme, setTheme] = useTheme();
  return (
    <Ticket aere>
      <TicketPartie>Affichage</TicketPartie>
      <div role="group" aria-label="Thème de l’appli" className="grid grid-cols-3 gap-2">
        {Object.entries(THEME_LABELS).map(([value, label]) => (
          <Puce
            key={value}
            actif={theme === value}
            onClick={() => setTheme(value)}
            className="px-1 text-[11px] lg:px-3 lg:text-libelle"
          >
            {label}
          </Puce>
        ))}
      </div>
      <p className="mt-2 font-text text-ui text-encre-2">{THEME_AIDE[theme]}</p>
      {avecLiens && (
        <>
          <TicketPartie>Liens</TicketPartie>
          <ul>
            <LienLigne to="/planning" texte="Réglages du planning" />
            {isAdmin && <LienLigne to="/admin" texte="Administration" />}
          </ul>
        </>
      )}
    </Ticket>
  );
}

function LienLigne({ to, texte }) {
  return (
    <li>
      <Link to={to} className="flex min-h-9 items-center gap-2 text-[15px]">
        <span>{texte}</span>
        <span aria-hidden="true" className="flex-1 border-t-2 border-dotted border-pointilles" />
        <ChevronRight size={16} strokeWidth={1.8} aria-hidden="true" />
      </Link>
    </li>
  );
}

// Déconnexion de cet appareil (bouton noir) ; celle de tous les appareils, en lien discret dessous.
function Deconnexion() {
  const logout = useLogout(false);
  const logoutAll = useLogout(true);
  return (
    <div className="space-y-2">
      <Bouton
        type="noir"
        pending={logout.pending}
        pendingLabel="Déconnexion…"
        onClick={logout.run}
        className="w-full"
      >
        <LogOut size={16} strokeWidth={1.8} aria-hidden="true" />
        Se déconnecter
      </Bouton>
      <button
        type="button"
        onClick={logoutAll.run}
        disabled={logoutAll.pending}
        className="w-full cursor-pointer py-2 text-center text-ui font-bold underline disabled:opacity-50"
      >
        {logoutAll.pending ? 'Déconnexion…' : 'Me déconnecter de tous les appareils'}
      </button>
      <MessageErreur>{logout.error ?? logoutAll.error}</MessageErreur>
    </div>
  );
}
