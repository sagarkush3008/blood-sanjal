import { Router } from 'express';
import { MediaController } from './media.controller';
import { requireAuth } from '../../core/middleware/auth.middleware';
import multer from 'multer';

const router = Router();

// Use memory storage for Multer
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB absolute max across all types
  }
});

router.post('/upload', requireAuth, upload.single('file'), MediaController.upload);
router.get('/:assetId/signed-url', requireAuth, MediaController.getSignedUrl);
router.delete('/:assetId', requireAuth, MediaController.deleteAsset);

export default router;
