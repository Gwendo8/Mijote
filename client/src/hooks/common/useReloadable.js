import { useCallback, useEffect, useState } from 'react';
import { getErrorMessage } from '../../utils/errorMessage.js';

// Comme useLoad, mais `reload` remet à jour SANS vider l'écran : les données précédentes restent affichées
// pendant le rechargement (une liste de réglages ne clignote pas après chaque clic). { data, loading, error, reload }.
export function useReloadable(load) {
  const [version, setVersion] = useState(0);
  const [state, setState] = useState({ data: null, error: null, done: false });

  useEffect(() => {
    let ignore = false;
    load()
      .then((data) => !ignore && setState({ data, error: null, done: true }))
      .catch(
        (error) =>
          !ignore &&
          setState((old) => ({ data: old.data, error: getErrorMessage(error), done: true })),
      );
    return () => {
      ignore = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- seule `version` relance le chargement
  }, [version]);

  return {
    data: state.data,
    error: state.error,
    loading: !state.done,
    reload: useCallback(() => setVersion((v) => v + 1), []),
  };
}
