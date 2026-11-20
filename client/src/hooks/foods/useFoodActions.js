import { useCallback, useEffect, useState } from 'react';
import {
  createFood,
  deleteFood,
  getFoodByBarcode,
  removeFoodCorrection,
  saveFoodCorrection,
  searchOffFoods,
  updateFood,
} from '../../services/foods/foodsService.js';
import { useAction } from '../common/useAction.js';

// Envois : chacun renvoie { pending, error, fieldErrors, run }, `run` répond { ok, data }.
export const useCreateFood = () => useAction(createFood);

export function useUpdateFood(id) {
  return useAction(useCallback((values) => updateFood(id, values), [id]));
}

export function useDeleteFood(id) {
  return useAction(useCallback(() => deleteFood(id), [id]));
}

export const useBarcodeLookup = () => useAction(getFoodByBarcode);

export function useSaveCorrection(id) {
  return useAction(useCallback((values) => saveFoodCorrection(id, values), [id]));
}

export function useRemoveCorrection(id) {
  return useAction(useCallback(() => removeFoodCorrection(id), [id]));
}

// Recherche chez Open Food Facts (lente, limitée). Les produits trouvés sont gardés pour la recherche `q` ;
// si `q` change, on repart de zéro.
// Limite atteinte (429) : `attente` = secondes restantes ; la recherche est bloquée jusque-là
// (le bouton est grisé, la recherche automatique ne part pas).
export function useOffSearch(q) {
  const action = useAction(searchOffFoods);
  const [found, setFound] = useState({ q: null, items: [] });
  const [bloqueJusqua, setBloqueJusqua] = useState(0);
  const [maintenant, setMaintenant] = useState(() => Date.now());
  const term = q.trim();
  const { run } = action;
  const attente = Math.max(0, Math.ceil((bloqueJusqua - maintenant) / 1000));

  // Compte à rebours, une fois par seconde, seulement pendant le blocage
  useEffect(() => {
    if (bloqueJusqua <= Date.now()) return undefined;
    const timer = setInterval(() => {
      const now = Date.now();
      setMaintenant(now);
      if (now >= bloqueJusqua) clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
  }, [bloqueJusqua]);

  const search = useCallback(async () => {
    if (bloqueJusqua > Date.now()) return { ok: false };
    const result = await run(term);
    if (result.ok) setFound({ q: term, items: result.data.items });
    if (result.error?.status === 429) {
      const now = Date.now();
      setMaintenant(now);
      setBloqueJusqua(now + (result.error.retryAfter ?? 60) * 1000);
    }
    return result;
  }, [run, term, bloqueJusqua]);

  return {
    ...action,
    // Pendant le blocage, le bouton grisé dit déjà quoi faire : pas de message rouge en plus
    error: attente > 0 ? null : action.error,
    items: found.q === term ? found.items : [],
    search,
    done: found.q === term,
    attente,
  };
}
