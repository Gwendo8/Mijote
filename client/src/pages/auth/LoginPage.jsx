import { useState } from 'react';
import { Link } from 'react-router';
import Bouton from '../../components/ui/Bouton.jsx';
import Champ from '../../components/ui/Champ.jsx';
import MessageErreur from '../../components/ui/MessageErreur.jsx';
import { Lock, Mail } from 'lucide-react';
import CodeBarres from '../../components/ui/CodeBarres.jsx';
import Ticket, { TicketEntete, TicketTirets } from '../../components/ui/Ticket.jsx';
import { useLogin } from '../../hooks/auth/useLogin.js';
import { usePublicSettings } from '../../hooks/auth/usePublicSettings.js';
import { loginSchema } from '../../schemas/auth.js';
import { validate } from '../../utils/validate.js';

export default function LoginPage() {
  const [values, setValues] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const login = useLogin();
  const settings = usePublicSettings();

  const change = (field) => (event) => setValues({ ...values, [field]: event.target.value });

  async function submit(event) {
    event.preventDefault();
    const result = validate(loginSchema, values);
    setErrors(result.errors ?? {});
    if (result.errors) return;
    // Succès : la session change, RedirectIfAuth emmène sur l'appli
    await login.run(result.data);
  }

  const fieldErrors = { ...login.fieldErrors, ...errors };

  return (
    <Ticket aere>
      <TicketEntete titre="Connexion" sousTitre="bon retour en cuisine" />
      <TicketTirets />
      <form onSubmit={submit} noValidate className="mt-4 space-y-4">
        <Champ
          label="E-mail"
          type="email"
          name="email"
          icone={Mail}
          autoComplete="email"
          value={values.email}
          onChange={change('email')}
          error={fieldErrors.email}
        />
        <Champ
          label="Mot de passe"
          type="password"
          name="password"
          icone={Lock}
          autoComplete="current-password"
          value={values.password}
          onChange={change('password')}
          error={fieldErrors.password}
        />
        <Link
          to="/mot-de-passe-oublie"
          className="inline-flex min-h-9 items-center rounded-coin border-[1.5px] border-encre px-2 text-libelle font-bold lg:text-ui"
        >
          Mot de passe oublié ?
        </Link>
        <MessageErreur>{login.error}</MessageErreur>
        <Bouton htmlType="submit" pending={login.pending} className="w-full">
          Se connecter
        </Bouton>
      </form>
      <p className="mt-4 font-text text-[14px] leading-[1.55] text-encre-2">
        Pas encore de compte ? Mijote fonctionne sur invitation : demande un lien à l’admin.
        {settings.data?.registrationOpen && (
          <>
            {' '}
            Les inscriptions sont ouvertes :{' '}
            <Link to="/inscription" className="font-bold text-encre underline">
              créer un compte
            </Link>
            .
          </>
        )}
      </p>
      <CodeBarres />
    </Ticket>
  );
}
