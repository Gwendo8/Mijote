import Fenetre from '../ui/Fenetre.jsx';
import FormulaireImport from './FormulaireImport.jsx';

// L'import par lien sur PC : une fenêtre posée sur la liste.
export default function FenetreImport({ onClose, onUse, onManual }) {
  return (
    <Fenetre titre="Importer une recette" onClose={onClose} large>
      <FormulaireImport onUse={onUse} onManual={onManual} plat />
    </Fenetre>
  );
}
