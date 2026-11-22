import { useCallback, useEffect, useState } from 'react';
import {
  addEntry,
  deleteEntry,
  getWeek,
  listSlots,
  updateEntry,
} from '../../services/planning/planningService.js';
import { getErrorMessage } from '../../utils/errorMessage.js';
import { useAction } from '../common/useAction.js';
import { useLoad } from '../common/useLoad.js';

// La semaine qui commence ce lundi : { week, loading, error, reload }.
// `reload` remet les données à jour SANS vider l'écran (les fenêtres ouvertes ne bougent pas) ;
// changer de semaine, lui, affiche le chargement.
export function usePlanningWeek(monday) {
  const [version, setVersion] = useState(0);
  const [state, setState] = useState({ monday: null, week: null, error: null });

  useEffect(() => {
    let ignore = false;
    getWeek(monday)
      .then((week) => !ignore && setState({ monday, week, error: null }))
      .catch((error) => !ignore && setState({ monday, week: null, error: getErrorMessage(error) }));
    return () => {
      ignore = true;
    };
  }, [monday, version]);

  const current = state.monday === monday;
  return {
    week: current ? state.week : null,
    error: current ? state.error : null,
    loading: !current,
    reload: useCallback(() => setVersion((v) => v + 1), []),
  };
}

// Mes créneaux visibles (pour « Mettre au planning » depuis une fiche, où on ne connaît pas encore la semaine).
export function useVisibleSlots() {
  const { data, loading, error } = useLoad('slots', listSlots);
  return { slots: (data ?? []).filter((slot) => !slot.isHidden), loading, error };
}

// Envois : chacun renvoie { pending, error, fieldErrors, run }, `run` répond { ok, data }.
export const useAddEntry = () => useAction(addEntry);

export function useUpdateEntry(id) {
  return useAction(useCallback((values) => updateEntry(id, values), [id]));
}

export function useDeleteEntry(id) {
  return useAction(useCallback(() => deleteEntry(id), [id]));
}
