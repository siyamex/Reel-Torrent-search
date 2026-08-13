import { Router } from 'express';
import {
  createTask,
  deleteTask,
  getFolderContents,
  getQuota,
  listTasks,
} from '../controllers/seedrController';

const router = Router();

router.get('/quota', getQuota);

router.get('/tasks', listTasks);
router.post('/tasks', createTask);
router.delete('/tasks/:id', deleteTask);

router.get('/folders/:id/contents', getFolderContents);

export default router;
