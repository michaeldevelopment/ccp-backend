import './config/env';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { errorHandler } from '@presentation/http/middleware/errorHandler';
import {
  authRouter,
  meRouter,
  userRouter,
  groupRouter,
  moduleRouter,
  classRouter,
  progressRouter,
  reassignmentRouter,
  dashboardRouter,
  notificationsRouter,
} from '@presentation/http/routes';
import { env } from '@config/env';

const app = express();

app.use(helmet());
app.use(cors({ origin: env.FRONTEND_URL }));
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/auth', authRouter);
app.use('/me', meRouter);
app.use('/users', userRouter);
app.use('/groups', groupRouter);
app.use('/modules', moduleRouter);
app.use('/classes', classRouter);
app.use('/progress', progressRouter);
app.use('/reassignments', reassignmentRouter);
app.use('/dashboard', dashboardRouter);
app.use('/notifications', notificationsRouter);

app.use(errorHandler);

export { app };
