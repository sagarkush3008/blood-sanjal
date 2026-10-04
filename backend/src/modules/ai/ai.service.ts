import { GoogleGenerativeAI } from '@google/generative-ai';
import { AppError } from '../../core/errors/appError';

export interface HealthData {
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  weightKg: number;
  recentTattoos: boolean;
  recentAntibiotics: boolean;
  lastDonationDate: string; // ISO String
}

export interface AIEligibilityResult {
  nextEligibleDate: string; // YYYY-MM-DD
  recoveryTips: string[];
}

export class AIService {
  public static async analyzeDonationEligibility(healthData: HealthData): Promise<AIEligibilityResult> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('[AIService] GEMINI_API_KEY is not defined in environment variables');
      throw new AppError(500, 'INTERNAL_ERROR', 'AI Configuration is missing.');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `
      You are an expert medical assistant for a blood donation platform.
      Analyze the following donor health data and calculate the exact next eligible donation date.
      
      Standard rules:
      - Men: 90 days from last donation.
      - Women: 120 days from last donation.
      - Tattoos: Add an additional 6 months (180 days) wait time.
      - Antibiotics: Add an additional 14 days wait time.
      
      Also provide 3 short, personalized health recovery tips (diet, hydration, rest).

      Donor Data:
      ${JSON.stringify(healthData, null, 2)}

      CRITICAL: You MUST return your response STRICTLY as a valid JSON object without any markdown wrapping, code blocks, or extra text.
      The JSON must exactly match this format:
      {
        "nextEligibleDate": "YYYY-MM-DD",
        "recoveryTips": ["Tip 1", "Tip 2", "Tip 3"]
      }
    `;

    try {
      const result = await model.generateContent(prompt);
      const responseText = result.response.text().trim();
      
      // Extract JSON using regex in case the AI adds conversational text
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('AI response did not contain valid JSON');
      }
      const parsedData: AIEligibilityResult = JSON.parse(jsonMatch[0]);

      return parsedData;
    } catch (error: any) {
      console.error('[AIService] Failed to analyze eligibility:', error);
      throw new AppError(500, 'AI_ERROR', error.message || 'AI analysis failed. Please try again.');
    }
  }
}
