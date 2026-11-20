import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '../../test/axe.js';
import Bouton from './Bouton.jsx';
import Champ from './Champ.jsx';
import Chargement from './Chargement.jsx';
import Confirmation from './Confirmation.jsx';
import DialogueConfirmation from './DialogueConfirmation.jsx';
import EtatVide from './EtatVide.jsx';
import Etiquette from './Etiquette.jsx';
import Fenetre from './Fenetre.jsx';
import MessageErreur from './MessageErreur.jsx';
import Puce from './Puce.jsx';
import Tampon from './Tampon.jsx';
import Ticket, {
  TicketEntete,
  TicketLigne,
  TicketPartie,
  TicketTirets,
  TicketTotal,
} from './Ticket.jsx';

describe('Bouton', () => {
  it('appelle onClick', async () => {
    const onClick = vi.fn();
    render(<Bouton onClick={onClick}>Enregistrer</Bouton>);
    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    expect(onClick).toHaveBeenCalledOnce();
  });
  it('affiche « Impression… » et se bloque pendant l’envoi', () => {
    render(<Bouton pending>Enregistrer</Bouton>);
    const button = screen.getByRole('button', { name: 'Impression…' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
  });
  it('peut être un lien', () => {
    render(
      <Bouton as="a" href="/x">
        Aller
      </Bouton>,
    );
    expect(screen.getByRole('link', { name: 'Aller' })).toHaveAttribute('href', '/x');
  });
});

describe('Champ', () => {
  it('relie le libellé, l’aide et l’erreur au champ', () => {
    render(<Champ label="Nom" help="Une aide" error="Obligatoire" />);
    const input = screen.getByLabelText('Nom');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('Obligatoire Une aide');
  });
  it('est accessible', async () => {
    const { container } = render(<Champ label="Nom" />);
    await expectNoA11yViolations(container);
  });
});

describe('états', () => {
  it('Chargement annonce le chargement', () => {
    render(<Chargement />);
    expect(screen.getByRole('status')).toHaveTextContent('Chargement…');
  });
  it('EtatVide affiche son texte et son action', () => {
    render(
      <EtatVide texte="Crée ta première recette.">
        <button>Créer</button>
      </EtatVide>,
    );
    expect(screen.getByText('Rien à additionner')).toBeInTheDocument();
    expect(screen.getByText('Crée ta première recette.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Créer' })).toBeInTheDocument();
  });
  it('MessageErreur ne rend rien sans message', () => {
    const { container } = render(<MessageErreur>{null}</MessageErreur>);
    expect(container).toBeEmptyDOMElement();
  });
  it('MessageErreur est une alerte', () => {
    render(<MessageErreur>Oups</MessageErreur>);
    expect(screen.getByRole('alert')).toHaveTextContent('Oups');
  });
  it('Confirmation écrit le message à côté du tampon', () => {
    render(<Confirmation>Recette enregistrée.</Confirmation>);
    expect(screen.getByRole('status')).toHaveTextContent('Recette enregistrée.');
  });
});

describe('Puce', () => {
  it('dit si elle est active', () => {
    render(<Puce actif>Végé</Puce>);
    expect(screen.getByRole('button', { name: 'Végé' })).toHaveAttribute('aria-pressed', 'true');
  });
});

describe('Ticket', () => {
  it('assemble en-tête, lignes et total', async () => {
    const { container } = render(
      <Ticket>
        <TicketEntete titre="Shakshuka" sousTitre="2 parts" />
        <TicketTirets />
        <TicketPartie>Midi</TicketPartie>
        <TicketLigne nom="Poulet" valeur="520" />
        <TicketTotal valeur="1 495" />
      </Ticket>,
    );
    expect(screen.getByRole('heading', { name: 'Shakshuka' })).toBeInTheDocument();
    expect(screen.getByText('520')).toBeInTheDocument();
    expect(screen.getByText('1 495')).toBeInTheDocument();
    await expectNoA11yViolations(container);
  });
});

describe('Tampon', () => {
  it('annonce les calories par part', () => {
    render(<Tampon kcal={270} proteins={17} carbs={30} fats={9} />);
    expect(screen.getByRole('img', { name: '270 kcal par part' })).toBeInTheDocument();
  });
  it('affiche « ? » quand les calories sont inconnues', () => {
    render(<Tampon />);
    expect(screen.getByRole('img', { name: 'Calories inconnues' })).toHaveTextContent('?');
  });
});

describe('Etiquette', () => {
  it('montre le prix, les protéines et le titre', () => {
    render(
      <Etiquette
        titre="Shakshuka"
        detail="35 min, 2 parts"
        nutrition={{ caloriesPerServing: 270, proteinsPerServing: 17 }}
      />,
    );
    expect(screen.getByRole('heading', { name: 'Shakshuka' })).toBeInTheDocument();
    expect(screen.getAllByText('270').length).toBeGreaterThan(0);
    expect(screen.getByText('17 g prot.')).toBeInTheDocument();
  });
  it('affiche « kcal ? » sans calories', () => {
    render(
      <Etiquette
        titre="Pad thaï"
        nutrition={{ caloriesPerServing: null, proteinsPerServing: null }}
      />,
    );
    expect(screen.getByText('kcal ?')).toBeInTheDocument();
  });
});

describe('Fenetre', () => {
  it('se ferme avec Échap et avec le bouton Fermer', async () => {
    const onClose = vi.fn();
    render(
      <Fenetre titre="Ajouter" onClose={onClose}>
        <input aria-label="Nom" />
      </Fenetre>,
    );
    expect(screen.getByRole('dialog', { name: 'Ajouter' })).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    await userEvent.click(screen.getByRole('button', { name: 'Fermer' }));
    expect(onClose).toHaveBeenCalledTimes(2);
  });
  it('garde le focus dans la fenêtre', async () => {
    render(
      <Fenetre titre="Ajouter" onClose={() => {}}>
        <input aria-label="Nom" />
      </Fenetre>,
    );
    await userEvent.tab();
    await userEvent.tab();
    await userEvent.tab();
    expect(screen.getByRole('dialog').contains(document.activeElement)).toBe(true);
  });
  it('est accessible', async () => {
    const { container } = render(
      <Fenetre titre="Ajouter" onClose={() => {}}>
        Texte
      </Fenetre>,
    );
    await expectNoA11yViolations(container);
  });
});

describe('DialogueConfirmation', () => {
  it('nomme l’action et appelle les bons rappels', async () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(
      <DialogueConfirmation
        titre="Supprimer"
        message="Sûr ?"
        confirmLabel="Supprimer le créneau et ses 3 plats"
        error="Raté"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Raté');
    await userEvent.click(
      screen.getByRole('button', { name: 'Supprimer le créneau et ses 3 plats' }),
    );
    await userEvent.click(screen.getByRole('button', { name: 'Annuler' }));
    expect(onConfirm).toHaveBeenCalledOnce();
    expect(onCancel).toHaveBeenCalledOnce();
  });
});
