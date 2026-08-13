import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import * as userAuth from '../controllers/userAuthController';
import * as seedrAuth from '../controllers/seedrAuthController';

const router = Router();

// App-level authentication. Reachable without being logged in, obviously.
router.post('/register', userAuth.register);
router.post('/login', userAuth.login);
router.post('/logout', userAuth.logout);
router.get('/me', userAuth.me);

// Connecting Seedr requires an app login first, since we need to know which
// user this Seedr connection belongs to. Seedr has no OAuth app-registration
// process for third parties, so this signs in with the user's own Seedr
// email/password directly (see seedrService.ts for details) and stores only
// the resulting tokens — never the password itself.
router.post('/seedr/connect', requireAuth, seedrAuth.connect);
router.get('/seedr/status', requireAuth, seedrAuth.status);
router.post('/seedr/logout', requireAuth, seedrAuth.logout);

export default router;
