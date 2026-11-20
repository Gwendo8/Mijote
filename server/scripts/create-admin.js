// Crée le premier compte admin (sans lui, personne ne peut inviter personne).
// Usage : npm run admin:create -- ton@email.fr "Ton nom"
// Le mot de passe est demandé dans le terminal (il ne s'affiche pas et n'est écrit nulle part).
import { createInterface } from 'node:readline';
import { password as passwordSchema, email as emailSchema } from '../src/schemas/auth.schema.js';
import { createAdminAccount } from '../src/services/auth.service.js';
import { sequelize } from '../src/models/index.js';

// Une seule interface de lecture pour les deux questions. Les lignes tapées sont mises en file :
// avec un texte collé ou envoyé par un tube, plusieurs lignes arrivent d'un coup.
const rl = createInterface({ input: process.stdin, terminal: Boolean(process.stdin.isTTY) });
const lines = [];
const waiting = [];
let hidden = false;
rl.on('line', (line) => (waiting.length ? waiting.shift()(line) : lines.push(line)));
// Quand la saisie est masquée, on n'écrit plus ce qui est tapé dans le terminal
rl._writeToOutput = (text) => {
  if (!hidden) process.stdout.write(text);
};

function askHidden(question) {
  process.stdout.write(question);
  hidden = true;
  return new Promise((resolve) => {
    const done = (line) => {
      hidden = false;
      process.stdout.write('\n');
      resolve(line);
    };
    if (lines.length) done(lines.shift());
    else waiting.push(done);
  });
}

const [, , rawEmail, displayName] = process.argv;
if (!rawEmail || !displayName) {
  console.error('Usage : npm run admin:create -- ton@email.fr "Ton nom"');
  process.exit(1);
}

try {
  const email = emailSchema.parse(rawEmail);
  const password = await askHidden('Mot de passe : ');
  const check = passwordSchema.safeParse(password);
  if (!check.success) throw new Error(check.error.issues.map((i) => i.message).join(' ; '));
  if ((await askHidden('Confirme le mot de passe : ')) !== password) {
    throw new Error('Les deux mots de passe sont différents');
  }

  const user = await createAdminAccount({ email, password, displayName });
  console.log(`Compte admin créé : ${user.displayName} <${user.email}>`);
} catch (error) {
  console.error(`✖ ${error.message}`);
  process.exitCode = 1;
} finally {
  rl.close();
  await sequelize.close();
}
