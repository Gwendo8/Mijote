import { env } from '../config/env.js';

// Contenu des e-mails envoyés par Mijote (texte simple + version HTML sobre).
// Liens vers le front : APP_URL/inscription?token=… et APP_URL/mot-de-passe?token=…

function escapeHtml(text) {
  return text.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

function layout(paragraphs, link, linkLabel) {
  const body = paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join('');
  return `<!doctype html><html lang="fr"><body style="font-family:sans-serif;color:#1d2b25;line-height:1.5">
<h1 style="font-family:monospace;color:#24634B">Mijote</h1>${body}
<p><a href="${escapeHtml(link)}" style="display:inline-block;background:#24634B;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none">${escapeHtml(linkLabel)}</a></p>
<p style="font-size:13px;color:#555">Si le bouton ne marche pas, copie ce lien dans ton navigateur :<br>${escapeHtml(link)}</p>
</body></html>`;
}

export function invitationEmail(token) {
  const link = `${env.APP_URL}/inscription?token=${token}`;
  const paragraphs = [
    'Bonjour,',
    'Tu es invité·e à rejoindre Mijote, l’appli de recettes, de calories et de planning des repas.',
    'Crée ton compte avec le lien ci-dessous. Il est valable 7 jours.',
  ];
  return {
    subject: 'Ton invitation à Mijote',
    text: `${paragraphs.join('\n\n')}\n\n${link}\n`,
    html: layout(paragraphs, link, 'Créer mon compte'),
  };
}

// byAdmin : le lien a été demandé par l'admin (durée 24 h) ; sinon, mot de passe oublié (1 h).
export function passwordResetEmail(token, { byAdmin = false } = {}) {
  const link = `${env.APP_URL}/mot-de-passe?token=${token}`;
  const paragraphs = byAdmin
    ? [
        'Bonjour,',
        "L'administratrice de Mijote t'envoie ce lien pour choisir un nouveau mot de passe. Il est valable 24 heures.",
        'Elle ne connaît pas ton mot de passe : toi seul·e le choisis.',
      ]
    : [
        'Bonjour,',
        'Tu as demandé à changer ton mot de passe Mijote. Choisis-en un nouveau avec le lien ci-dessous : il est valable 1 heure.',
        "Si ce n'est pas toi, ignore simplement cet e-mail : ton mot de passe ne change pas.",
      ];
  return {
    subject: 'Nouveau mot de passe Mijote',
    text: `${paragraphs.join('\n\n')}\n\n${link}\n`,
    html: layout(paragraphs, link, 'Choisir un nouveau mot de passe'),
  };
}
