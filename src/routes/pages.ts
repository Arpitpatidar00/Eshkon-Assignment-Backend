import { Router } from 'express';
import { getPageDraft, getAllPageSlugs, updatePageDraft } from '../controllers/page.controller';
import { requireAuth, requireRole } from '../middlewares/auth.middleware';

const router = Router();

router.get('/:slug', getPageDraft);
router.put('/:slug', requireAuth, requireRole('editor', 'publisher'), updatePageDraft);
router.get('/', getAllPageSlugs);

export default router;
