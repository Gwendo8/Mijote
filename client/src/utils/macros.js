// Part de chaque macro dans les calories (protéines × 4, glucides × 4, lipides × 9), en pourcentage.
// Renvoie null si on ne peut pas calculer (aucun gramme connu).
export function macroShares({ proteins, carbs, fats }) {
  const p = (proteins ?? 0) * 4;
  const c = (carbs ?? 0) * 4;
  const f = (fats ?? 0) * 9;
  const total = p + c + f;
  if (total <= 0) return null;
  return { proteins: (p / total) * 100, carbs: (c / total) * 100, fats: (f / total) * 100 };
}

// Dans les listes, l'API ne donne que les calories et les protéines par part : on montre la part des protéines
// (en bleu) et le reste en gris neutre, sans inventer la répartition entre glucides et lipides.
export function proteinOnlyShares(kcal, proteins) {
  if (!kcal || kcal <= 0 || proteins === null || proteins === undefined) return null;
  const share = Math.min(100, ((proteins * 4) / kcal) * 100);
  return { proteins: share, carbs: 0, fats: 0, other: 100 - share };
}

// Dégradé conique de l'anneau, du haut dans le sens des aiguilles d'une montre : protéines, glucides, lipides.
export function ringGradient(shares) {
  const a = shares.proteins;
  const b = a + shares.carbs;
  if (shares.other) return `conic-gradient(var(--prot) 0 ${a}%, var(--tirets) ${a}% 100%)`;
  return `conic-gradient(var(--prot) 0 ${a}%, var(--gluc) ${a}% ${b}%, var(--lip) ${b}% 100%)`;
}
