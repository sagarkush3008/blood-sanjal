import { Router } from 'express';
import { getTerms, getPrivacyPolicy, getMedicalDisclaimer } from './legal.controller';

const router = Router();

router.get('/terms', getTerms);
router.get('/privacy', getPrivacyPolicy);
router.get('/disclaimer', getMedicalDisclaimer);

export default router;
