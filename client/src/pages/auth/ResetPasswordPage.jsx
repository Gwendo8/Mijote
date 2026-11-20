import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import Bouton from '../../components/ui/Bouton.jsx';
import Champ from '../../components/ui/Champ.jsx';
import Chargement from '../../components/ui/Chargement.jsx';
import EtatVide from '../../components/ui/EtatVide.jsx';
import MessageErreur from '../../components/ui/MessageErreur.jsx';
import { Lock } from 'lucide-react';
import CodeBarres from '../../components/ui/CodeBarres.jsx';
import ReglesMotDePasse from '../../components/ui/ReglesMotDePasse.jsx';
import Ticket, { TicketEntete, TicketTirets } from '../../components/ui/Ticket.jsx';
import { useResetLink } from '../../hooks/auth/useResetLink.js';
import { useResetPassword } from '../../hooks/auth/useResetPassword.js';
import { resetPasswordSchema } from '../../schemas/auth.js';
import { formatJusqua } from '../../utils/dates.js';
import { validate } from '../../utils/validate.js';

// Nouveau mot de passe, depuis le lien reçu par e-mail. Pas de connexion automatique : on se reconnecte ensuite.
export default function ResetPasswordPage() {
  const token = useSearchParams()[0].get('token');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [errors, setErrors] = useState({});
  const [done, setDone] = useState(false);
  const reset = useResetPassword();
  const link = useResetLink(token);

  if (token && link.loading) return <Chargement />;
  if (!token || (link.error && !done)) {
    return (
      <EtatVide titre="Lien invalide" texte="Ce lien n’est plus valable. Demande-en un nouveau.">
        <Bouton as={Link} to="/mot-de-passe-oublie" type="contour">
          Demander un nouveau lien
        </Bouton>
      </EtatVide>
    );
  }

  async function submit(event) {
    event.preventDefault();
    const result = validate(resetPasswordSchema, { password });
    const found = { ...(result.errors ?? {}) };
    if (!found.password && password !== confirmation) {
      found.confirmation = 'Les deux mots de passe ne sont pas identiques.';
    }
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    const outcome = await reset.run({ token, password: result.data.password });
    if (outcome.ok) setDone(true);
  }

  const fieldErrors = { ...reset.fieldErrors, ...errors };

  return (
    <Ticket aere>
      <TicketEntete
        titre="Nouveau mot de passe"
        sousTitre={link.data?.email ? `pour ${link.data.email}` : undefined}
      />
      <TicketTirets />
      {done ? (
        <div className="mt-4 space-y-4">
          <p role="status" className="font-text text-lecture leading-[1.55]">
            Mot de passe changé. Tu peux te connecter avec le nouveau.
          </p>
          <Bouton as={Link} to="/connexion" className="w-full">
            Aller à la connexion
          </Bouton>
        </div>
      ) : (
        <form onSubmit={submit} noValidate className="mt-4 space-y-4">
          <Champ
            label="Nouveau mot de passe"
            type="password"
            name="password"
            icone={Lock}
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            error={fieldErrors.password}
          />
          <Champ
            label="Le même, une deuxième fois"
            type="password"
            name="confirmation"
            icone={Lock}
            autoComplete="new-password"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            error={fieldErrors.confirmation}
          />
          <ReglesMotDePasse motDePasse={password} />
          {fieldErrors.token && <MessageErreur>{fieldErrors.token}</MessageErreur>}
          <MessageErreur>{reset.error}</MessageErreur>
          <Bouton htmlType="submit" pending={reset.pending} className="w-full">
            Enregistrer le mot de passe
          </Bouton>
          <p className="font-text text-[14px] leading-[1.5] text-encre-2">
            {link.data?.expiresAt && (
              <span className="mb-1 block font-bold text-encre">
                Lien valable {formatJusqua(link.data.expiresAt)}.
              </span>
            )}
            Lien expiré ? Les liens marchent 1 heure. Redemande-en un depuis « Mot de passe oublié
            ».
          </p>
        </form>
      )}
      <CodeBarres />
    </Ticket>
  );
}
