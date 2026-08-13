import { Router } from 'express';
import { getMovieDetails, getTrending, searchMovies } from '../controllers/moviesController';

const router = Router();

router.get('/trending/:window', getTrending);
router.get('/search', searchMovies);
router.get('/:id', getMovieDetails);

export default router;
