import { useState } from 'react';
import Bouton from '../../components/ui/Bouton.jsx';
import Champ from '../../components/ui/Champ.jsx';
import MessageErreur from '../../components/ui/MessageErreur.jsx';
import ReglesMotDePasse from '../../components/ui/ReglesMotDePasse.jsx';
import { useChangePassword } from '../../hooks/me/useChangePassword.js';
import { changePasswordSchema } from '../../schemas/auth.js';
import { validate } from '../../utils/validate.js';

// Formulaire « changer le mot de passe ». `enLigne` : deux colonnes dans le ticket du PC.
export default function PasswordForm({ enLigne = false, onSaved }) {
  const change = useChangePassword();
  const [values, setValues] = useState({ currentPassword: '', newPassword: '' });
  const [errors, setErrors] = useState({});

  const edit = (field) => (event) => setValues({ ...values, [field]: event.target.value });

  async function submit(event) {
    event.preventDefault();
    const result = validate(changePasswordSchema, values);
    setErrors(result.errors ?? {});
    if (result.errors) return;
    const outcome = await change.run(result.data);
    if (outcome.ok) {
      setValues({ currentPassword: '', newPassword: '' });
      onSaved('Mot de passe changé. Tes autres appareils sont déconnectés.');
    }
  }

  const fieldErrors = { ...change.fieldErrors, ...errors };

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <div className={enLigne ? 'grid grid-cols-2 gap-3' : 'space-y-4'}>
        <Champ
          label="Mot de passe actuel"
          type="password"
          name="currentPassword"
          autoComplete="current-password"
          value={values.currentPassword}
          onChange={edit('currentPassword')}
          error={fieldErrors.currentPassword}
        />
        <Champ
          label="Nouveau"
          type="password"
          name="newPassword"
          autoComplete="new-password"
          placeholder="8 caractères minimum"
          value={values.newPassword}
          onChange={edit('newPassword')}
          error={fieldErrors.newPassword}
        />
      </div>
      {(!enLigne || values.newPassword) && <ReglesMotDePasse motDePasse={values.newPassword} />}
      <MessageErreur>{change.error}</MessageErreur>
      <Bouton
        htmlType="submit"
        type={enLigne ? 'contour' : 'principal'}
        pending={change.pending}
        className={enLigne ? '' : 'w-full'}
      >
        Changer le mot de passe
      </Bouton>
    </form>
  );
}
