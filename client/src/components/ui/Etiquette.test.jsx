import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Etiquette from './Etiquette.jsx';

const anneau = (container) => container.querySelector('[style*="conic-gradient"]').style.background;

describe('Etiquette', () => {
  it("montre protéines, glucides et lipides dans l'anneau quand la liste donne le détail par part", () => {
    const { container } = render(
      <Etiquette
        titre="Poulet riz"
        nutrition={{
          caloriesPerServing: 500,
          proteinsPerServing: 40,
          perServing: { calories: 500, proteins: 40, carbs: 50, fats: 15 },
        }}
      />,
    );
    expect(anneau(container)).toContain('var(--gluc)');
    expect(anneau(container)).toContain('var(--lip)');
  });

  it('se contente de la part des protéines quand aucun aliment ne donne le détail', () => {
    const { container } = render(
      <Etiquette
        titre="Recette saisie à la main"
        nutrition={{
          caloriesPerServing: 400,
          proteinsPerServing: 20,
          perServing: { calories: 0, proteins: 0, carbs: 0, fats: 0 },
        }}
      />,
    );
    expect(anneau(container)).not.toContain('var(--gluc)');
    expect(anneau(container)).toContain('var(--prot)');
  });
});
