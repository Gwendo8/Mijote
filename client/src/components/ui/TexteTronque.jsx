import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';

// Texte sur une ligne, coupé par « … » s'il est trop long. Au survol de la souris ou au focus clavier,
// une bulle montre le texte complet, seulement s'il est vraiment coupé.
// La bulle est posée sur `document.body` (position fixe) : un ticket découpe ce qui dépasse de ses bords.
// Le texte complet reste lu en entier par les lecteurs d'écran (la coupure n'est que visuelle).
export default function TexteTronque({ children, className = '' }) {
  const ref = useRef(null);
  const [position, setPosition] = useState(null);

  function montrer() {
    const el = ref.current;
    if (!el || el.scrollWidth <= el.clientWidth) return;
    const box = el.getBoundingClientRect();
    setPosition({ top: box.bottom + 6, left: box.left });
  }
  const cacher = () => setPosition(null);

  return (
    <span
      className="block"
      onMouseEnter={montrer}
      onMouseLeave={cacher}
      onFocus={montrer}
      onBlur={cacher}
    >
      <span ref={ref} className={`block truncate ${className}`}>
        {children}
      </span>
      {position &&
        createPortal(
          <span
            aria-hidden="true"
            style={{ top: position.top, left: position.left }}
            className="pointer-events-none fixed z-50 w-max max-w-[560px] rounded-coin bg-encre px-3 py-2 text-ui font-medium text-surface shadow-lg"
          >
            {children}
          </span>,
          document.body,
        )}
    </span>
  );
}
