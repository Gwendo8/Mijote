import { useState } from 'react';
import { Link } from 'react-router';
import Bouton from '../../components/ui/Bouton.jsx';
import Champ from '../../components/ui/Champ.jsx';
import MessageErreur from '../../components/ui/MessageErreur.jsx';
import Ticket, { TicketEntete } from '../../components/ui/Ticket.jsx';
import { useForgotPassword } from '../../hooks/auth/useForgotPassword.js';
import { forgotPasswordSchema } from '../../schemas/auth.js';
import { validate } from '../../utils/validate.js';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState({});
  const [sent, setSent] = useState(false);
  const forgot = useForgotPassword();

  async function submit(event) {
    event.preventDefault();
    const result = validate(forgotPasswordSchema, { email });
    setErrors(result.errors ?? {});
    if (result.errors) return;
    const outcome = await forgot.run(result.data.email);
    if (outcome.ok) setSent(true);
  }

  const fieldErrors = { ...forgot.fieldErrors, ...errors };

  return (
    <Ticket>
      <TicketEntete titre="Mijote" sousTitre="Mot de passe oublié" />
      {sent ? (
        <p role="status" className="font-text text-lecture leading-[1.55]">
          Si cette adresse a un compte, un e-mail vient de partir avec un lien valable 1 heure.
          Pense à regarder tes indésirables.
        </p>
      ) : (
        <form onSubmit={submit} noValidate className="space-y-4">
          <Champ
            label="Adresse e-mail"
            type="email"
            name="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            error={fieldErrors.email}
          />
          <MessageErreur>{forgot.error}</MessageErreur>
          <Bouton htmlType="submit" pending={forgot.pending} className="w-full">
            Envoyer le lien
          </Bouton>
        </form>
      )}
      <p className="mt-5 text-center font-text text-lecture">
        <Link to="/connexion" className="underline">
          Retour à la connexion
        </Link>
      </p>
    </Ticket>
  );
}
