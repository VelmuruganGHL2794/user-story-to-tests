import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { ZodError } from 'zod';
import { fetchStoryRouter } from './routes/fetchStory';
import { generateRouter }   from './routes/generate';

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173' }));
app.use(express.json({ limit: '10mb' }));
app.use(morgan('short'));

const apiLimiter = rateLimit({
  windowMs: 60_000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api/fetch-story',    apiLimiter);
app.use('/api/generate-tests', apiLimiter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', version: '2.0.0' });
});

app.use('/api', fetchStoryRouter);
app.use('/api', generateRouter);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(`[ERROR] ${err.message}`);

  if (err instanceof ZodError) {
    res.status(400).json({ error: 'Validation failed', details: err.errors });
    return;
  }

  const status = err.message.includes('not set') ? 500
    : err.message.includes('Invalid ClickUp') ? 400
    : err.message.includes('ClickUp fetch failed: 401') ? 401
    : err.message.includes('ClickUp fetch failed: 404') ? 404
    : 500;

  res.status(status).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message,
  });
});

export default app;
