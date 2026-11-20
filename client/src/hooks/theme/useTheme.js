import { useCallback, useState } from 'react';
import { applyTheme, readTheme } from '../../utils/theme.js';

// Le thème choisi sur cet appareil : [theme, setTheme].
export function useTheme() {
  const [theme, setThemeState] = useState(readTheme);
  const setTheme = useCallback((value) => {
    applyTheme(value);
    setThemeState(value);
  }, []);
  return [theme, setTheme];
}
