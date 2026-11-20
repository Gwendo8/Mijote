import { useCallback, useEffect, useRef, useState } from 'react';
import { getErrorMessage, getFieldErrors } from '../../utils/errorMessage.js';

// Stocke l'état d'une action (envoi d'un formulaire, suppression…) : en cours, erreur, erreurs par champ.
// `action` doit être stable (une fonction de service, ou un useCallback).
// `run(...args)` renvoie { ok: true, data } ou { ok: false } et ignore ce qui arrive après le démontage.
export function useAction(action) {
  const [state, setState] = useState({ pending: false, error: null, fieldErrors: {} });
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const run = useCallback(
    async (...args) => {
      setState({ pending: true, error: null, fieldErrors: {} });
      try {
        const data = await action(...args);
        if (mounted.current) setState({ pending: false, error: null, fieldErrors: {} });
        return { ok: true, data };
      } catch (error) {
        if (mounted.current) {
          setState({
            pending: false,
            error: getErrorMessage(error),
            fieldErrors: getFieldErrors(error),
          });
        }
        return { ok: false, error };
      }
    },
    [action],
  );

  const reset = useCallback(() => setState({ pending: false, error: null, fieldErrors: {} }), []);

  return { ...state, run, reset };
}
