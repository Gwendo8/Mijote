import { useEffect, useState } from 'react';

const QUERY = '(min-width: 1024px)';

// Vrai sur PC (1024 px et plus). Sert quand la disposition change vraiment (pas seulement la taille) :
// sur PC les formulaires du profil sont posés dans la page, sur téléphone ils s'ouvrent dans une fenêtre.
export function useIsDesktop() {
  const read = () =>
    typeof window.matchMedia === 'function' ? window.matchMedia(QUERY).matches : false;
  const [isDesktop, setIsDesktop] = useState(read);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return undefined;
    const media = window.matchMedia(QUERY);
    const onChange = () => setIsDesktop(media.matches);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  return isDesktop;
}
