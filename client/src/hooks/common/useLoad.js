import { useEffect, useState } from 'react';
import { getErrorMessage } from '../../utils/errorMessage.js';

// Charge une donnée quand `key` change : { data, loading, error }.
// Une réponse qui arrive après un changement de `key` ou le démontage est ignorée.
// `load` peut changer à chaque rendu : seule `key` décide d'un nouveau chargement.
export function useLoad(key, load) {
  const [result, setResult] = useState({ key: null, data: null, error: null });

  useEffect(() => {
    if (key === null) return undefined;
    let ignore = false;
    load()
      .then((data) => !ignore && setResult({ key, data, error: null }))
      .catch((error) => !ignore && setResult({ key, data: null, error: getErrorMessage(error) }));
    return () => {
      ignore = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- seule `key` relance le chargement
  }, [key]);

  const done = result.key === key;
  return {
    data: done ? result.data : null,
    error: done ? result.error : null,
    loading: key !== null && !done,
  };
}
