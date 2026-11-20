import { useState } from 'react';
import { Link } from 'react-router';
import Bouton from '../../components/ui/Bouton.jsx';
import Champ from '../../components/ui/Champ.jsx';
import MessageErreur from '../../components/ui/MessageErreur.jsx';
import Ticket, { TicketEntete } from '../../components/ui/Ticket.jsx';
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
    <Ticket>
      <TicketEntete titre="Mijote" sousTitre="Connexion" />
      <form onSubmit={submit} noValidate className="space-y-4">
        <Champ
          label="Adresse e-mail"
          type="email"
          name="email"
          autoComplete="email"
          value={values.email}
          onChange={change('email')}
          error={fieldErrors.email}
        />
        <Champ
          label="Mot de passe"
          type="password"
          name="password"
          autoComplete="current-password"
          value={values.password}
          onChange={change('password')}
          error={fieldErrors.password}
        />
        <MessageErreur>{login.error}</MessageErreur>
        <Bouton htmlType="submit" pending={login.pending} className="w-full">
          Se connecter
        </Bouton>
      </form>
      <nav aria-label="Autres choix" className="mt-5 space-y-2 text-center font-text text-lecture">
        <p>
          <Link to="/mot-de-passe-oublie" className="underline">
            Mot de passe oublié ?
          </Link>
        </p>
        {settings.data?.registrationOpen && (
          <p>
            <Link to="/inscription" className="underline">
              Créer un compte
            </Link>
          </p>
        )}
      </nav>
    </Ticket>
  );
}
