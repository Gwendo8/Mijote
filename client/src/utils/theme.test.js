import { afterEach, describe, expect, it, vi } from 'vitest';
import { applyTheme, readTheme } from './theme.js';

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('thème', () => {
  it('est clair par défaut', () => {
    expect(readTheme()).toBe('light');
  });
  it('retient le choix sur l’appareil et le pose sur <html>', () => {
    applyTheme('dark');
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    expect(readTheme()).toBe('dark');
  });
  it('ignore une valeur inconnue', () => {
    localStorage.setItem('mijote-theme', 'violet');
    expect(readTheme()).toBe('light');
  });
  it('reste clair si le stockage est indisponible', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('bloqué');
    });
    expect(readTheme()).toBe('light');
  });
});
