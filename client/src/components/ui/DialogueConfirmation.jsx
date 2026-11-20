import Bouton from './Bouton.jsx';
import Fenetre from './Fenetre.jsx';
import MessageErreur from './MessageErreur.jsx';

// Confirmation avant une action grave. Le bouton nomme toujours l'action (« Supprimer le créneau et ses 3 plats »).
export default function DialogueConfirmation({
  titre,
  message,
  confirmLabel,
  danger = true,
  pending = false,
  error = null,
  onConfirm,
  onCancel,
  children,
}) {
  return (
    <Fenetre titre={titre} onClose={onCancel}>
      <p className="mb-4 font-text text-lecture leading-[1.55]">{message}</p>
      {children}
      <div className="mt-4">
        <MessageErreur>{error}</MessageErreur>
      </div>
      <div className="mt-4 flex flex-col gap-3">
        <Bouton type={danger ? 'danger' : 'principal'} pending={pending} onClick={onConfirm}>
          {confirmLabel}
        </Bouton>
        <Bouton type="contour" onClick={onCancel}>
          Annuler
        </Bouton>
      </div>
    </Fenetre>
  );
}
