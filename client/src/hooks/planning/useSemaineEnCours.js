import { useMemo } from 'react';
import { jourCourt, mondayOf, papierDuCreneau, today } from '../../utils/planning.js';
import { usePlanningWeek } from './usePlanning.js';

// La semaine en cours, pour décorer la liste des recettes : { jour, slots, talons, loading }.
// - `jour` : aujourd'hui (calories prévues et lignes), ou null tant qu'on ne l'a pas ou en cas d'erreur ;
// - `talons` : pour chaque recette prévue à partir d'aujourd'hui cette semaine, le prochain repas
//   (« Mer. midi ») et le papier de son créneau. En cas d'erreur, rien n'est affiché : le bandeau est facultatif.
export function useSemaineEnCours() {
  const date = today();
  const { week, loading } = usePlanningWeek(mondayOf(date));

  const talons = useMemo(() => {
    const map = new Map();
    if (!week) return map;
    week.days
      .filter((day) => day.date >= date)
      .forEach((day) =>
        day.entries.forEach((entry) => {
          const id = entry.recipe?.id;
          if (!id || map.has(id)) return;
          const index = week.slots.findIndex((slot) => slot.id === entry.slotId);
          if (index < 0) return;
          const court = jourCourt(day.date);
          map.set(id, {
            libelle: `${court.charAt(0).toUpperCase()}${court.slice(1)}. ${week.slots[index].name.toLowerCase()}`,
            papier: papierDuCreneau(index),
          });
        }),
      );
    return map;
  }, [week, date]);

  return {
    jour: week?.days.find((day) => day.date === date) ?? null,
    slots: week?.slots ?? [],
    talons,
    loading,
  };
}
