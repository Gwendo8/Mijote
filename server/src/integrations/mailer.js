import { env } from '../config/env.js';
import { HttpError } from '../utils/HttpError.js';

// Envoi d'e-mails (invitations, mot de passe oublié). Seul endroit qui parle au service d'e-mails.
// - Avec BREVO_API_KEY et MAIL_FROM_EMAIL : envoi réel par l'API Brevo (gratuit jusqu'à 300 e-mails par jour).
// - Sinon (développement, tests) : rien ne part ; l'e-mail est affiché dans le terminal et gardé dans sentEmails.

const BREVO_URL = 'https://api.brevo.com/v3/smtp/email';

// E-mails « envoyés » sans Brevo (les tests y lisent les liens)
export const sentEmails = [];

export function isConfigured() {
  return Boolean(env.BREVO_API_KEY && env.MAIL_FROM_EMAIL);
}

export async function sendEmail({ to, subject, text, html }) {
  if (!isConfigured()) {
    sentEmails.push({ to, subject, text, html });
    if (env.NODE_ENV !== 'test') {
      console.info(
        `\n✉️  E-mail (non envoyé, Brevo non configuré)\nÀ : ${to}\nObjet : ${subject}\n\n${text}\n`,
      );
    }
    return;
  }

  let response;
  try {
    response = await fetch(BREVO_URL, {
      method: 'POST',
      headers: {
        'api-key': env.BREVO_API_KEY,
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        sender: { email: env.MAIL_FROM_EMAIL, name: env.MAIL_FROM_NAME },
        to: [{ email: to }],
        subject,
        textContent: text,
        htmlContent: html,
      }),
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    response = null;
  }
  if (!response?.ok) {
    console.error(`Échec de l'envoi d'e-mail à ${to} (statut ${response?.status ?? 'réseau'})`);
    throw new HttpError(502, "L'e-mail n'a pas pu être envoyé, réessaie plus tard");
  }
}
