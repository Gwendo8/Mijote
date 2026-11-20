import { useState } from 'react';
import { useNavigate } from 'react-router';
import Bouton from '../../components/ui/Bouton.jsx';
import Champ from '../../components/ui/Champ.jsx';
import Confirmation from '../../components/ui/Confirmation.jsx';
import DialogueConfirmation from '../../components/ui/DialogueConfirmation.jsx';
import MessageErreur from '../../components/ui/MessageErreur.jsx';
import Puce from '../../components/ui/Puce.jsx';
import Ticket, { TicketEntete, TicketPartie } from '../../components/ui/Ticket.jsx';
import { useSession } from '../../hooks/auth/useSession.js';
import { useLogout } from '../../hooks/auth/useLogout.js';
import { useChangePassword } from '../../hooks/me/useChangePassword.js';
import { useDeleteAccount } from '../../hooks/me/useDeleteAccount.js';
import { useUpdateProfile } from '../../hooks/me/useUpdateProfile.js';
import { useTheme } from '../../hooks/theme/useTheme.js';
import {
  changePasswordSchema,
  deleteAccountSchema,
  displayName,
  email,
} from '../../schemas/auth.js';
import { validate } from '../../utils/validate.js';
import { z } from 'zod';

const profileSchema = z.object({ displayName, email });

const THEME_LABELS = { light: 'Clair', auto: 'Automatique', dark: 'Sombre' };

export default function ProfilePage() {
  return (
    <div className="mx-auto max-w-160 space-y-6">
      <h1 className="largeur-large text-ecran font-extrabold lg:text-ecran-pc">Mon compte</h1>
      <InfosSection />
      <PasswordSection />
      <ThemeSection />
      <SessionsSection />
      <DeleteSection />
    </div>
  );
}

function InfosSection() {
  const { user } = useSession();
  const update = useUpdateProfile();
  const [values, setValues] = useState({
    displayName: user.displayName,
    email: user.email,
    currentPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [saved, setSaved] = useState(false);

  const emailChanged = values.email.trim().toLowerCase() !== user.email;
  const change = (field) => (event) => {
    setSaved(false);
    setValues({ ...values, [field]: event.target.value });
  };

  async function submit(event) {
    event.preventDefault();
    setSaved(false);
    const result = validate(profileSchema, values);
    const found = { ...(result.errors ?? {}) };
    if (emailChanged && !values.currentPassword) {
      found.currentPassword = 'Saisis ton mot de passe actuel pour changer d’adresse';
    }
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    const body = { displayName: result.data.displayName };
    if (emailChanged) {
      body.email = result.data.email;
      body.currentPassword = values.currentPassword;
    }
    const outcome = await update.run(body);
    if (outcome.ok) {
      setSaved(true);
      setValues((v) => ({ ...v, currentPassword: '' }));
    }
  }

  const fieldErrors = { ...update.fieldErrors, ...errors };

  return (
    <Ticket>
      <TicketEntete titre="Mes informations" as="h2" />
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
          value={values.email}
          onChange={change('email')}
          error={fieldErrors.email}
        />
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
          />
        )}
        <MessageErreur>{update.error}</MessageErreur>
        {saved && <Confirmation>Informations enregistrées.</Confirmation>}
        <Bouton htmlType="submit" pending={update.pending} className="w-full">
          Enregistrer
        </Bouton>
      </form>
    </Ticket>
  );
}

function PasswordSection() {
  const change = useChangePassword();
  const [values, setValues] = useState({ currentPassword: '', newPassword: '' });
  const [errors, setErrors] = useState({});
  const [saved, setSaved] = useState(false);

  const edit = (field) => (event) => {
    setSaved(false);
    setValues({ ...values, [field]: event.target.value });
  };

  async function submit(event) {
    event.preventDefault();
    setSaved(false);
    const result = validate(changePasswordSchema, values);
    setErrors(result.errors ?? {});
    if (result.errors) return;
    const outcome = await change.run(result.data);
    if (outcome.ok) {
      setSaved(true);
      setValues({ currentPassword: '', newPassword: '' });
    }
  }

  const fieldErrors = { ...change.fieldErrors, ...errors };

  return (
    <Ticket>
      <TicketEntete titre="Mot de passe" as="h2" />
      <form onSubmit={submit} noValidate className="space-y-4">
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
          label="Nouveau mot de passe"
          type="password"
          name="newPassword"
          autoComplete="new-password"
          value={values.newPassword}
          onChange={edit('newPassword')}
          error={fieldErrors.newPassword}
          help="8 caractères au moins, avec un chiffre et un caractère spécial (! ? - #). Tes autres appareils seront déconnectés."
        />
        <MessageErreur>{change.error}</MessageErreur>
        {saved && <Confirmation>Mot de passe changé.</Confirmation>}
        <Bouton htmlType="submit" pending={change.pending} className="w-full">
          Changer le mot de passe
        </Bouton>
      </form>
    </Ticket>
  );
}

function ThemeSection() {
  const [theme, setTheme] = useTheme();
  return (
    <Ticket>
      <TicketEntete titre="Apparence" as="h2" />
      <div
        role="group"
        aria-label="Thème de l’appli"
        className="flex flex-wrap justify-center gap-2"
      >
        {Object.entries(THEME_LABELS).map(([value, label]) => (
          <Puce key={value} actif={theme === value} onClick={() => setTheme(value)}>
            {label}
          </Puce>
        ))}
      </div>
      <p className="mt-3 text-center font-text text-ui text-encre-2">
        Ce réglage est gardé sur cet appareil.
      </p>
    </Ticket>
  );
}

function SessionsSection() {
  const logout = useLogout(false);
  const logoutAll = useLogout(true);
  return (
    <Ticket>
      <TicketEntete titre="Connexion" as="h2" />
      <TicketPartie>Cet appareil</TicketPartie>
      <Bouton
        type="contour"
        pending={logout.pending}
        pendingLabel="Déconnexion…"
        onClick={logout.run}
        className="w-full"
      >
        Me déconnecter
      </Bouton>
      <TicketPartie>Tous les appareils</TicketPartie>
      <Bouton
        type="contour"
        pending={logoutAll.pending}
        pendingLabel="Déconnexion…"
        onClick={logoutAll.run}
        className="w-full"
      >
        Me déconnecter partout
      </Bouton>
      <div className="mt-3">
        <MessageErreur>{logout.error ?? logoutAll.error}</MessageErreur>
      </div>
    </Ticket>
  );
}

function DeleteSection() {
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
    <Ticket>
      <TicketEntete titre="Supprimer mon compte" as="h2" />
      <p className="mb-4 font-text text-lecture leading-[1.55]">
        Tes recettes, tes aliments perso et ton planning seront supprimés pour toujours. Les copies
        faites par d’autres personnes restent chez elles.
      </p>
      <Bouton type="danger" onClick={() => setOpen(true)} className="w-full">
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
    </Ticket>
  );
}
