import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router';
import Bouton from '../../components/ui/Bouton.jsx';
import Champ from '../../components/ui/Champ.jsx';
import DialogueConfirmation from '../../components/ui/DialogueConfirmation.jsx';
import { useDeleteAccount } from '../../hooks/me/useDeleteAccount.js';
import { deleteAccountSchema } from '../../schemas/auth.js';
import { validate } from '../../utils/validate.js';

// Zone « Supprimer mon compte » : encadré rouge, puis une fenêtre qui demande le mot de passe.
export default function DeleteAccount() {
  const navigate = useNavigate();
  const del = useDeleteAccount();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  function close() {
    setOpen(false);
    setPassword('');
    setError(null);
    del.reset();
  }

  async function confirm() {
    const result = validate(deleteAccountSchema, { password });
    if (result.errors) {
      setError(result.errors.password);
      return;
    }
    setError(null);
    const outcome = await del.run(password);
    if (outcome.ok) navigate('/connexion', { replace: true });
  }

  return (
    <section
      aria-labelledby="supprimer-compte"
      className="rounded-coin border-[1.5px] border-erreur bg-erreur-fond p-4"
    >
      <h2 id="supprimer-compte" className="text-ui font-extrabold text-erreur">
        Supprimer mon compte
      </h2>
      <p className="mt-2 mb-3 font-text text-ui leading-[1.5]">
        Tout ce qui t’appartient sera supprimé pour de bon : recettes, idées, aliments perso,
        planning. Les copies faites par d’autres restent chez eux.
      </p>
      <Bouton type="danger" onClick={() => setOpen(true)} className="lg:min-h-10">
        <Trash2 size={16} strokeWidth={1.8} aria-hidden="true" />
        Supprimer mon compte
      </Bouton>
      {open && (
        <DialogueConfirmation
          titre="Supprimer le compte"
          message="Cette action est définitive. Saisis ton mot de passe pour confirmer."
          confirmLabel="Supprimer mon compte et tout ce qu’il contient"
          pending={del.pending}
          error={error ?? del.error}
          onConfirm={confirm}
          onCancel={close}
        >
          <Champ
            label="Mot de passe"
            type="password"
            name="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </DialogueConfirmation>
      )}
    </section>
  );
}
