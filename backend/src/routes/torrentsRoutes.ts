import { Router } from 'express';
import { searchTorrents } from '../controllers/torrentsController';

const router = Router();

router.get('/search', searchTorrents);

export default router;
