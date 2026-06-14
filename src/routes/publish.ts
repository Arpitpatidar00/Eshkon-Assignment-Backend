import { Router } from 'express';
import { previewPublish, publishPage, getReleases } from '../controllers/publish.controller';
import { requireAuth, requireRole } from '../middlewares/auth.middleware';

const router = Router();

router.get('/preview', previewPublish);
router.post('/', requireAuth, requireRole('publisher'), publishPage);
router.get('/releases', getReleases);

export default router;
