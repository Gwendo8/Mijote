import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import Bouton from '../../components/ui/Bouton.jsx';
import Champ from '../../components/ui/Champ.jsx';
import EtatVide from '../../components/ui/EtatVide.jsx';
import MessageErreur from '../../components/ui/MessageErreur.jsx';
import Ticket, { TicketEntete } from '../../components/ui/Ticket.jsx';
import { useResetPassword } from '../../hooks/auth/useResetPassword.js';
import { resetPasswordSchema } from '../../schemas/auth.js';
import { validate } from '../../utils/validate.js';

// Nouveau mot de passe, depuis le lien reçu par e-mail. Pas de connexion automatique : on se reconnecte ensuite.
export default function ResetPasswordPage() {
  const token = useSearchParams()[0].get('token');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [done, setDone] = useState(false);
  const reset = useResetPassword();

  if (!token) {
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
    setErrors(result.errors ?? {});
    if (result.errors) return;
    const outcome = await reset.run({ token, password: result.data.password });
    if (outcome.ok) setDone(true);
  }

  const fieldErrors = { ...reset.fieldErrors, ...errors };

  return (
    <Ticket>
      <TicketEntete titre="Mijote" sousTitre="Nouveau mot de passe" />
      {done ? (
        <div className="space-y-4">
          <p role="status" className="font-text text-lecture leading-[1.55]">
            Mot de passe changé. Tu peux te connecter avec le nouveau.
          </p>
          <Bouton as={Link} to="/connexion" className="w-full">
            Aller à la connexion
          </Bouton>
        </div>
      ) : (
        <form onSubmit={submit} noValidate className="space-y-4">
          <Champ
            label="Nouveau mot de passe"
            type="password"
            name="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            error={fieldErrors.password}
            help="8 caractères au moins, avec un chiffre et un caractère spécial (! ? - #)."
          />
          {fieldErrors.token && <MessageErreur>{fieldErrors.token}</MessageErreur>}
          <MessageErreur>{reset.error}</MessageErreur>
          <Bouton htmlType="submit" pending={reset.pending} className="w-full">
            Changer le mot de passe
          </Bouton>
        </form>
      )}
    </Ticket>
  );
}
