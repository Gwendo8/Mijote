import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import Bouton from '../../components/ui/Bouton.jsx';
import Champ from '../../components/ui/Champ.jsx';
import Chargement from '../../components/ui/Chargement.jsx';
import EtatVide from '../../components/ui/EtatVide.jsx';
import MessageErreur from '../../components/ui/MessageErreur.jsx';
import { Lock, Mail } from 'lucide-react';
import CodeBarres from '../../components/ui/CodeBarres.jsx';
import ReglesMotDePasse from '../../components/ui/ReglesMotDePasse.jsx';
import Ticket, { TicketEntete, TicketTirets } from '../../components/ui/Ticket.jsx';
import { useInvitation } from '../../hooks/auth/useInvitation.js';
import { usePublicSettings } from '../../hooks/auth/usePublicSettings.js';
import { useRegister } from '../../hooks/auth/useRegister.js';
import { registerSchema } from '../../schemas/auth.js';
import { formatJourMois } from '../../utils/dates.js';
import { validate } from '../../utils/validate.js';

// Inscription : par lien d'invitation (e-mail imposé) ou, si l'admin a ouvert les inscriptions, libre.
export default function RegisterPage() {
  const token = useSearchParams()[0].get('token');
  const invitation = useInvitation(token);
  const settings = usePublicSettings();
  const [values, setValues] = useState({ firstName: '', lastName: '', email: '', password: '' });
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
    <Ticket aere>
      <TicketEntete
        titre="Bienvenue"
        sousTitre={token ? 'ton invitation est prête' : 'crée ton compte'}
      />
      <TicketTirets />
      <form onSubmit={submit} noValidate className="mt-4 space-y-4">
        <Champ
          label="Prénom"
          name="firstName"
          autoComplete="given-name"
          value={values.firstName}
          onChange={change('firstName')}
          error={fieldErrors.firstName}
        />
        <Champ
          label="Nom"
          name="lastName"
          autoComplete="family-name"
          value={values.lastName}
          onChange={change('lastName')}
          error={fieldErrors.lastName}
        />
        <Champ
          label="E-mail"
          type="email"
          name="email"
          icone={Mail}
          autoComplete="email"
          value={lockedEmail ?? values.email}
          readOnly={Boolean(lockedEmail)}
          onChange={change('email')}
          error={fieldErrors.email}
          help={lockedEmail ? 'L’adresse de l’invitation ne se change pas ici.' : undefined}
        />
        <div>
          <Champ
            label="Mot de passe"
            type="password"
            name="password"
            icone={Lock}
            autoComplete="new-password"
            value={values.password}
            onChange={change('password')}
            error={fieldErrors.password}
          />
          <ReglesMotDePasse motDePasse={values.password} />
        </div>
        <MessageErreur>{register.error}</MessageErreur>
        <Bouton htmlType="submit" pending={register.pending} className="w-full">
          Créer mon compte
        </Bouton>
        {token && invitation.data.expiresAt && (
          <p className="font-text text-[14px] leading-[1.5] text-encre-2">
            Lien valable jusqu’au {formatJourMois(invitation.data.expiresAt)}.
          </p>
        )}
      </form>
      <CodeBarres />
    </Ticket>
  );
}
