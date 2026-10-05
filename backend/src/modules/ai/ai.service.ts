import { GoogleGenerativeAI } from '@google/generative-ai';
import { AppError } from '../../core/errors/appError';

export interface HealthData {
  age: number;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  weightKg: number;
  recentTattoos: boolean;
  recentAntibiotics: boolean;
  isPregnant: boolean;
  hasSurgery: boolean;
  lastDonationDate: string; // ISO String
}

export interface AIEligibilityResult {
  isEligible: boolean;
  nextEligibleDate: string | null; // YYYY-MM-DD
  aiTips: string[];
}

export class AIService {
  public static async analyzeDonationEligibility(healthData: HealthData): Promise<AIEligibilityResult> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('[AIService] ❌ GEMINI_API_KEY is not defined in environment variables');
      throw new AppError(500, 'INTERNAL_ERROR', 'AI Configuration is missing.');
    } else {
      console.log(`[AIService] ✅ API Key loaded successfully (Starts with: ${apiKey.substring(0, 4)}... Length: ${apiKey.length})`);
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    // Using gemini-3.8-flash as the latest standard model
    const model = genAI.getGenerativeModel({ model: 'gemini-3.8-flash' });

    const prompt = `
      Evaluate blood donation eligibility. 
      User: Age ${healthData.age}, Gender ${healthData.gender}, Weight ${healthData.weightKg}kg, Tattoo ${healthData.recentTattoos}, Antibiotics ${healthData.recentAntibiotics}, Pregnant ${healthData.isPregnant}, Surgery ${healthData.hasSurgery}, Last Donation ${healthData.lastDonationDate}. 
      
      Rules: 
      - Age <18 or >65, Weight <45, Pregnant, or Surgery = totally ineligible (nextEligibleDate can be a distant future date like 9999-12-31 or calculated based on rules, but isEligible must be false). 
      - Tattoo = 6 months wait. 
      - Antibiotics = 14 days wait. 
      - Default wait = 90 days (males) / 120 days (females). 
      
      Calculate absolute nextEligibleDate (YYYY-MM-DD). Provide 3 personalized aiTips.

      CRITICAL: You MUST return your response STRICTLY as a valid JSON object without any markdown wrapping, code blocks, or extra text.
      The JSON must exactly match this format:
      {
        "isEligible": boolean,
        "nextEligibleDate": "YYYY-MM-DD",
        "aiTips": ["Tip 1", "Tip 2", "Tip 3"]
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
      // 1. Verbose Backend Logging
      console.error('\n--- [AIService] GEMINI API ERROR ---');
      console.error('Error Object:', error);
      console.error('Message:', error.message);
      console.error('Status:', error.status || error.code || 'UNKNOWN_STATUS');
      if (error.response) {
         console.error('Response details:', error.response);
      }
      console.error('------------------------------------\n');
      
      // Temporary Mock Fallback for Frontend Testing
      console.warn('[AIService] Using mock data because Google API is overloaded or failing.');
      
      const mockNextDate = new Date();
      mockNextDate.setDate(mockNextDate.getDate() + 90);
      
      return {
        isEligible: false,
        nextEligibleDate: mockNextDate.toISOString().split('T')[0],
        aiTips: [
          "Drink plenty of water over the next 24 hours.",
          "Eat iron-rich foods like spinach and red meat.",
          "Avoid strenuous physical activity for the rest of the day."
        ]
      };
    }
  }
}
