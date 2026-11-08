import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';
// Each module exposes only its router (its public interface).
import { router as identity } from './modules/identity/index.js';
import { router as trips } from './modules/trips/index.js';
import { router as reservations } from './modules/reservations/index.js';
import { router as notifications } from './modules/notifications/index.js';
import { router as moderation } from './modules/moderation/index.js';

export const app = express();
app.use(helmet());
app.use(cors({ origin: env.corsOrigin }));
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', identity);
app.use('/api/trips', trips);
app.use('/api/reservations', reservations);
app.use('/api/notifications', notifications);
app.use('/api/reports', moderation);

app.use(notFound);
app.use(errorHandler);
