import { Router } from 'express';
import moviesRoutes from './moviesRoutes';
import torrentsRoutes from './torrentsRoutes';
import authRoutes from './authRoutes';
import seedrRoutes from './seedrRoutes';
import { requireAuth } from '../middleware/requireAuth';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// /auth handles its own per-route auth requirements (register/login/me are
// public by definition; the seedr/* sub-routes require login internally).
router.use('/auth', authRoutes);

// Everything else requires an app login.
router.use('/movies', requireAuth, moviesRoutes);
router.use('/torrents', requireAuth, torrentsRoutes);
router.use('/seedr', requireAuth, seedrRoutes);

export default router;
