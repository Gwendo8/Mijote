import { useState } from 'react';
import { Mail } from 'lucide-react';
import { z } from 'zod';
import Bouton from '../../components/ui/Bouton.jsx';
import Champ from '../../components/ui/Champ.jsx';
import MessageErreur from '../../components/ui/MessageErreur.jsx';
import { useSession } from '../../hooks/auth/useSession.js';
import { useUpdateProfile } from '../../hooks/me/useUpdateProfile.js';
import { email, firstName, lastName } from '../../schemas/auth.js';
import { validate } from '../../utils/validate.js';

const profileSchema = z.object({ firstName, lastName, email });

// Formulaire « prénom, nom et e-mail ». Changer d'e-mail demande le mot de passe actuel.
// `enLigne` : sur PC deux colonnes dans le ticket ; dans une fenêtre (téléphone) une seule.
export default function InfosForm({ enLigne = false, onSaved }) {
  const { user } = useSession();
  const update = useUpdateProfile();
  const [values, setValues] = useState({
    firstName: user.firstName,
    lastName: user.lastName ?? '',
    email: user.email,
    currentPassword: '',
  });
  const [errors, setErrors] = useState({});

  const emailChanged = values.email.trim().toLowerCase() !== user.email;
  const change = (field) => (event) => setValues({ ...values, [field]: event.target.value });

  async function submit(event) {
    event.preventDefault();
    const result = validate(profileSchema, values);
    const found = { ...(result.errors ?? {}) };
    if (emailChanged && !values.currentPassword) {
      found.currentPassword = 'Saisis ton mot de passe actuel pour changer d’adresse';
    }
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    const body = { firstName: result.data.firstName, lastName: result.data.lastName };
    if (emailChanged) {
      body.email = result.data.email;
      body.currentPassword = values.currentPassword;
    }
    const outcome = await update.run(body);
    if (outcome.ok) {
      setValues((v) => ({ ...v, currentPassword: '' }));
      onSaved('Informations enregistrées.');
    }
  }

  const fieldErrors = { ...update.fieldErrors, ...errors };

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <div className={enLigne ? 'grid grid-cols-2 gap-3' : 'space-y-4'}>
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
          icone={enLigne ? undefined : Mail}
          autoComplete="email"
          value={values.email}
          onChange={change('email')}
          error={fieldErrors.email}
        />
      </div>
      {emailChanged && (
        <Champ
          label="Mot de passe actuel"
          type="password"
          name="currentPassword"
          autoComplete="current-password"
          value={values.currentPassword}
          onChange={change('currentPassword')}
          error={fieldErrors.currentPassword}
          help="Demandé pour changer d’adresse."
          className={enLigne ? 'max-w-xs' : ''}
        />
      )}
      <MessageErreur>{update.error}</MessageErreur>
      <Bouton htmlType="submit" pending={update.pending} className={enLigne ? '' : 'w-full'}>
        Enregistrer
      </Bouton>
    </form>
  );
}
