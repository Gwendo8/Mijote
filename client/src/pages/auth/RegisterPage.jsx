import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import Bouton from '../../components/ui/Bouton.jsx';
import Champ from '../../components/ui/Champ.jsx';
import Chargement from '../../components/ui/Chargement.jsx';
import EtatVide from '../../components/ui/EtatVide.jsx';
import MessageErreur from '../../components/ui/MessageErreur.jsx';
import Ticket, { TicketEntete } from '../../components/ui/Ticket.jsx';
import { useInvitation } from '../../hooks/auth/useInvitation.js';
import { usePublicSettings } from '../../hooks/auth/usePublicSettings.js';
import { useRegister } from '../../hooks/auth/useRegister.js';
import { registerSchema } from '../../schemas/auth.js';
import { validate } from '../../utils/validate.js';

// Inscription : par lien d'invitation (e-mail imposé) ou, si l'admin a ouvert les inscriptions, libre.
export default function RegisterPage() {
  const token = useSearchParams()[0].get('token');
  const invitation = useInvitation(token);
  const settings = usePublicSettings();
  const [values, setValues] = useState({ displayName: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const register = useRegister();

  const loading = token ? invitation.loading : settings.loading;
  if (loading) return <Chargement />;

  if (token && invitation.error) {
    return (
      <EtatVide
        titre="Lien invalide"
        texte="Cette invitation est invalide ou a expiré. Demande-en une nouvelle."
      >
        <Bouton as={Link} to="/connexion" type="contour">
          Aller à la connexion
        </Bouton>
      </EtatVide>
    );
  }
  if (!token && !settings.data?.registrationOpen) {
    return (
      <EtatVide
        titre="Inscriptions fermées"
        texte="Les inscriptions sont fermées : il faut une invitation pour créer un compte."
      >
        <Bouton as={Link} to="/connexion" type="contour">
          Aller à la connexion
        </Bouton>
      </EtatVide>
    );
  }

  const lockedEmail = token ? invitation.data.email : null;
  const change = (field) => (event) => setValues({ ...values, [field]: event.target.value });

  async function submit(event) {
    event.preventDefault();
    const input = { ...values, email: lockedEmail ?? values.email };
    const result = validate(registerSchema, input);
    setErrors(result.errors ?? {});
    if (result.errors) return;
    // Avec un jeton, le serveur prend l'e-mail de l'invitation
    await register.run({ ...result.data, ...(token ? { token } : {}) });
  }

  const fieldErrors = { ...register.fieldErrors, ...errors };

  return (
    <Ticket>
      <TicketEntete titre="Mijote" sousTitre="Créer un compte" />
      <form onSubmit={submit} noValidate className="space-y-4">
        <Champ
          label="Nom affiché"
          name="displayName"
          autoComplete="name"
          value={values.displayName}
          onChange={change('displayName')}
          error={fieldErrors.displayName}
        />
        <Champ
          label="Adresse e-mail"
          type="email"
          name="email"
          autoComplete="email"
          value={lockedEmail ?? values.email}
          readOnly={Boolean(lockedEmail)}
          onChange={change('email')}
          error={fieldErrors.email}
          help={lockedEmail ? 'Adresse de ton invitation, elle ne se change pas.' : undefined}
        />
        <Champ
          label="Mot de passe"
          type="password"
          name="password"
          autoComplete="new-password"
          value={values.password}
          onChange={change('password')}
          error={fieldErrors.password}
          help="8 caractères au moins, avec un chiffre et un caractère spécial (! ? - #)."
        />
        <MessageErreur>{register.error}</MessageErreur>
        <Bouton htmlType="submit" pending={register.pending} className="w-full">
          Créer mon compte
        </Bouton>
      </form>
      <p className="mt-5 text-center font-text text-lecture">
        <Link to="/connexion" className="underline">
          J’ai déjà un compte
        </Link>
      </p>
    </Ticket>
  );
}
