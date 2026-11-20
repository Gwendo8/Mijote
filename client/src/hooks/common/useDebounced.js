import { useEffect, useState } from 'react';

// Renvoie `value` avec un délai : pendant la frappe, la valeur ne change qu'après `delay` ms de calme.
export function useDebounced(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}
