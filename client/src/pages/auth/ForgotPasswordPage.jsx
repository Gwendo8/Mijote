import { useState } from 'react';
import { Link } from 'react-router';
import Bouton from '../../components/ui/Bouton.jsx';
import Champ from '../../components/ui/Champ.jsx';
import MessageErreur from '../../components/ui/MessageErreur.jsx';
import { Check, ChevronLeft, Mail, Send } from 'lucide-react';
import Ticket, { TicketEntete, TicketTirets } from '../../components/ui/Ticket.jsx';
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
    <Ticket aere>
      <TicketEntete titre="Mot de passe oublié" sousTitre="on t’envoie un lien" />
      <TicketTirets />
      <form onSubmit={submit} noValidate className="mt-4 space-y-4">
        <Champ
          label="E-mail"
          type="email"
          name="email"
          icone={Mail}
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={fieldErrors.email}
        />
        <MessageErreur>{forgot.error}</MessageErreur>
        <Bouton htmlType="submit" pending={forgot.pending} className="w-full">
          <Send size={16} strokeWidth={1.8} aria-hidden="true" />
          Recevoir le lien
        </Bouton>
      </form>
      {sent && (
        <>
          <TicketTirets />
          <div role="status" className="flex items-center gap-3 font-text text-ui leading-[1.5]">
            <Check size={20} strokeWidth={2.4} aria-hidden="true" className="shrink-0" />
            <p>
              Si un compte existe pour cette adresse, le lien vient de partir. Il marche 1 heure.
              Regarde aussi dans tes indésirables.
            </p>
          </div>
          <Bouton as={Link} to="/connexion" type="contour" className="mt-3">
            <ChevronLeft size={16} strokeWidth={1.8} aria-hidden="true" />
            Retour à la connexion
          </Bouton>
        </>
      )}
    </Ticket>
  );
}
