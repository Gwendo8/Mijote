// Réglage du thème : « Clair » par défaut, « Auto » suit l'appareil, « Sombre ».
// Gardé sur l'appareil (localStorage), pas sur le compte. index.html l'applique avant l'affichage.
export const THEMES = ['light', 'auto', 'dark'];
export const DEFAULT_THEME = 'light';
const KEY = 'mijote-theme';

export function readTheme() {
  try {
    const value = localStorage.getItem(KEY);
    return THEMES.includes(value) ? value : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME; // stockage indisponible (navigation privée…)
  }
}

export function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  try {
    localStorage.setItem(KEY, theme);
  } catch {
    /* tant pis : le thème ne sera pas retenu */
  }
}
