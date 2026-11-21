import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '../../test/axe.js';
import { mockApi } from '../../test/helpers.jsx';
import SelecteurAliment from './SelecteurAliment.jsx';

const skyr = {
  id: 1,
  source: 'ciqual',
  name: 'Skyr nature',
  brand: null,
  energyKcal: 63,
  proteinsG: 11,
  carbsG: 4,
  fatsG: 0.2,
};

afterEach(() => vi.unstubAllGlobals());

describe('SelecteurAliment', () => {
  it('cherche, choisit un aliment, demande les grammes puis ajoute', async () => {
    mockApi({ 'GET /foods?q=skyr&limit=50': { body: { items: [skyr], total: 1 } } });
    const onAdd = vi.fn();
    const { container } = render(<SelecteurAliment onAdd={onAdd} />);
    await expectNoA11yViolations(container);

    await userEvent.type(screen.getByLabelText('Chercher un aliment'), 'skyr');
    await userEvent.click(await screen.findByRole('button', { name: /Skyr nature/ }));
    const grams = screen.getByLabelText('Poids (g)');
    await userEvent.clear(grams);
    await userEvent.type(grams, '150');
    expect(screen.getByText('Environ 95 kcal')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Ajouter' }));

    expect(onAdd).toHaveBeenCalledWith({ food: skyr, grams: 150, estime: false });
    expect(screen.getByLabelText('Chercher un aliment')).toHaveValue('');
  });

  it('refuse un poids vide ou nul', async () => {
    mockApi({ 'GET /foods?q=skyr&limit=50': { body: { items: [skyr], total: 1 } } });
    const onAdd = vi.fn();
    render(
      <MemoryRouter>
        <SelecteurAliment onAdd={onAdd} />
      </MemoryRouter>,
    );
    await userEvent.type(screen.getByLabelText('Chercher un aliment'), 'skyr');
    await userEvent.click(await screen.findByRole('button', { name: /Skyr nature/ }));
    await userEvent.clear(screen.getByLabelText('Poids (g)'));
    await userEvent.click(screen.getByRole('button', { name: 'Ajouter' }));
    expect(screen.getByText(/Indique un poids en grammes/)).toBeInTheDocument();
    expect(onAdd).not.toHaveBeenCalled();
  });

  it('dit quand rien n’est trouvé', async () => {
    mockApi({ 'GET /foods?q=zzz&limit=50': { body: { items: [], total: 0 } } });
    render(<SelecteurAliment onAdd={() => {}} />);
    await userEvent.type(screen.getByLabelText('Chercher un aliment'), 'zzz');
    expect(await screen.findByText(/Aucun aliment trouvé/)).toBeInTheDocument();
  });
});
