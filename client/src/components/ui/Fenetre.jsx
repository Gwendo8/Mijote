import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

// Fenêtre : sur téléphone une feuille blanche qui monte du bas (poignée grise), sur PC une carte centrée, sur fond assombri.
// Posée directement dans <body> (portail) : une fenêtre qui contient un formulaire (choix d'un aliment) ne doit pas
// se trouver DANS le formulaire de la page, sinon le navigateur envoie le mauvais formulaire.
// Échap la ferme, le focus y entre et revient où il était (clavier et lecteurs d'écran).
export default function Fenetre({ titre, onClose, large = false, children }) {
  const titleId = useId();
  const panelRef = useRef(null);

  useEffect(() => {
    const before = document.activeElement;
    panelRef.current?.focus();
    return () => before?.focus?.();
  }, []);

  function onKeyDown(event) {
    if (event.key === 'Escape') {
      onClose();
      return;
    }
    if (event.key !== 'Tab') return;
    // Garde le focus dans la fenêtre
    const focusables = panelRef.current.querySelectorAll(
      'button:not([disabled]), input:not([disabled]), a[href], select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return createPortal(
    <div
      className="animate-fondu fixed inset-0 z-50 flex items-end justify-center bg-encre/40 lg:items-center"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={onKeyDown}
        className={`animate-monter max-h-[90vh] w-full overflow-y-auto rounded-t-panneau bg-surface px-5 pt-2.5 pb-7 text-encre outline-none lg:animate-fondu lg:rounded-panneau lg:px-6 lg:pt-6 ${large ? 'lg:max-w-145' : 'lg:max-w-120'}`}
      >
        <span
          aria-hidden="true"
          className="mx-auto mb-3 block h-1.25 w-11 rounded-full bg-tirets lg:hidden"
        />
        <div className="mb-3 flex items-start justify-between gap-2">
          <h2 id={titleId} className="text-[20px] font-extrabold tracking-tight">
            {titre}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="-m-2 flex size-11 cursor-pointer items-center justify-center"
          >
            <X size={20} strokeWidth={1.8} aria-hidden="true" />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}
