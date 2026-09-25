import { Request, Response } from 'express';
import { SuccessResponse } from '../../core/http/result';

export const getTerms = (req: Request, res: Response) => {
  const terms = {
    title: "Terms of Service",
    content: "By using Blood Sanjal, you agree to these terms. Blood Sanjal operates as a connection platform. We do not guarantee the availability of blood or the response of any registered donor. All search platform fees are strictly administrative and do not constitute a purchase of blood or medical services.",
    version: "1.0.0",
    lastUpdated: "2026-09-25T00:00:00.000Z"
  };
  res.status(200).json(SuccessResponse(terms, req.id));
};

export const getPrivacyPolicy = (req: Request, res: Response) => {
  const privacy = {
    title: "Privacy Policy",
    content: "Blood Sanjal is committed to protecting your privacy. We collect minimal personal data necessary to facilitate blood donation connections. Your contact information is never revealed to requesters without your explicit consent via contact-reveal flows. We employ strict data redaction and security measures.",
    version: "1.0.0",
    lastUpdated: "2026-09-25T00:00:00.000Z"
  };
  res.status(200).json(SuccessResponse(privacy, req.id));
};

export const getMedicalDisclaimer = (req: Request, res: Response) => {
  const disclaimer = {
    title: "Medical Disclaimer",
    content: "Blood Sanjal is a technology platform facilitating connections between blood donors and recipients. WE DO NOT PROVIDE MEDICAL ADVICE, DIAGNOSIS, OR GUARANTEE MEDICAL OUTCOMES. We do not determine medical eligibility for blood donation or transfusion. Always consult with certified medical professionals and hospital authorities regarding blood compatibility, safety, and eligibility.",
    version: "1.0.0",
    lastUpdated: "2026-09-25T00:00:00.000Z"
  };
  res.status(200).json(SuccessResponse(disclaimer, req.id));
};
