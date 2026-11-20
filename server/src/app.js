import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env } from './config/env.js';
import { authenticate } from './middlewares/auth.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { notFound } from './middlewares/notFound.js';
import { apiLimiter } from './middlewares/rateLimits.js';
import routes from './routes/index.js';

const app = express();

// Derrière Caddy (production) : l'adresse du visiteur est dans l'en-tête X-Forwarded-For.
// Sans ce réglage, toutes les requêtes auraient l'adresse de Caddy et les limites compteraient tout le monde ensemble.
if (env.NODE_ENV === 'production') app.set('trust proxy', 1);

// Sécurité de base
app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use('/api', apiLimiter);

app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());

// Remplit req.user si le cookie de session est valable (ne bloque rien)
app.use('/api', authenticate);
app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

export default app;
