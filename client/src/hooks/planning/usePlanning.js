import { useCallback, useEffect, useState } from 'react';
import {
  addEntry,
  copyDay,
  createShare,
  createSlot,
  deleteEntry,
  deleteShare,
  deleteSlot,
  getWeek,
  listSharedWithMe,
  listShares,
  listSlots,
  updateEntry,
  updateSlot,
} from '../../services/planning/planningService.js';
import { getErrorMessage } from '../../utils/errorMessage.js';
import { useAction } from '../common/useAction.js';
import { useLoad } from '../common/useLoad.js';
import { useReloadable } from '../common/useReloadable.js';

// La semaine qui commence ce lundi : { week, loading, error, reload }.
// `userId` : le planning d'une autre personne (partagé avec moi, en lecture seule) ; sans lui, le mien.
// `reload` remet les données à jour SANS vider l'écran (les fenêtres ouvertes ne bougent pas) ;
// changer de semaine, lui, affiche le chargement.
export function usePlanningWeek(monday, userId) {
  const [version, setVersion] = useState(0);
  const [state, setState] = useState({ monday: null, userId: undefined, week: null, error: null });

  useEffect(() => {
    let ignore = false;
    getWeek(monday, userId)
      .then((week) => !ignore && setState({ monday, userId, week, error: null }))
      .catch(
        (error) =>
          !ignore && setState({ monday, userId, week: null, error: getErrorMessage(error) }),
      );
    return () => {
      ignore = true;
    };
  }, [monday, userId, version]);

  const current = state.monday === monday && state.userId === userId;
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

// Copier un jour vers d'autres jours : `run(fromDate, toDates)` répond { ok, data: { count, entries } }.
export const useCopyDay = () => useAction(copyDay);

// Tous mes créneaux, masqués compris : { slots, loading, error, reload }.
export function useAllSlots() {
  const { data, loading, error, reload } = useReloadable(listSlots);
  return { slots: data ?? [], loading, error, reload };
}

export const useCreateSlot = () => useAction(createSlot);
export const useUpdateSlot = () => useAction(updateSlot);
export const useDeleteSlot = () => useAction(deleteSlot);

// Mes partages et les personnes dont je vois le planning.
export function useShares() {
  const { data, loading, error, reload } = useReloadable(listShares);
  return { shares: data ?? [], loading, error, reload };
}
export const useCreateShare = () => useAction(createShare);
export const useDeleteShare = () => useAction(deleteShare);

export function useSharedWithMe() {
  const { data, loading, error } = useLoad('shared-with-me', listSharedWithMe);
  return { people: data ?? [], loading, error };
}
