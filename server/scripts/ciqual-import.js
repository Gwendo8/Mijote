// Charge la table Ciqual (ANSES) dans la base. Usage : npm run ciqual:import -- dossier
// Le dossier contient les fichiers XML décompressés : alim_….xml, alim_grp_….xml et compo_….xml.
// Peut être relancé sans danger (voir src/services/ciqual-import.service.js).
import { sequelize } from '../src/models/index.js';
import { importCiqualFolder } from '../src/services/ciqual-import.service.js';

const folder = process.argv[2];
if (!folder) {
  console.error('Usage : npm run ciqual:import -- chemin/du/dossier');
  console.error(
    'Le dossier contient alim_….xml, alim_grp_….xml et compo_….xml (fichiers XML de l’ANSES).',
  );
  process.exit(1);
}

try {
  const base = new URL(process.env.DATABASE_URL).pathname.slice(1);
  console.log(`Import Ciqual dans la base « ${base} »…`);
  const report = await importCiqualFolder(folder);
  console.log(
    `Terminé : ${report.added} ajoutés, ${report.updated} mis à jour, ${report.restored} réactivés, ${report.unchanged} inchangés, ${report.archived} archivés.`,
  );
} catch (error) {
  console.error(`Échec de l'import : ${error.message}`);
  process.exitCode = 1;
} finally {
  await sequelize.close();
}
