// Place `item` à la position voulue dans `others` (la liste sans lui) ; sans position, il va à la fin.
// Renvoie la liste complète dans le nouvel ordre : la position de chaque élément est son rang.
export function insertAt(others, item, position) {
  const list = [...others];
  const index = position === undefined ? list.length : Math.min(position, list.length);
  list.splice(index, 0, item);
  return list;
}
