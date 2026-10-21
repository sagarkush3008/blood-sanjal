// **IMPORTANT: Run 'npm install @google/generative-ai@latest' in your backend terminal to ensure the latest Gemini models and API endpoints are supported.**

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
  /**
   * Analyzes blood donation eligibility using Google Gemini Generative AI.
   * Model instantiation uses exact model names without 'models/' prefix,
   * with automatic fallback across supported model tiers (1.5-flash -> 1.5-pro -> gemini-pro -> 2.5-flash).
   */
  public static async analyzeDonationEligibility(healthData: HealthData): Promise<AIEligibilityResult> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('[AIService] ❌ GEMINI_API_KEY is not defined in environment variables');
      throw new AppError(500, 'INTERNAL_ERROR', 'AI Configuration is missing.');
    }

    // 1. Initialize GoogleGenerativeAI with your API key
    const genAI = new GoogleGenerativeAI(apiKey);

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

    // Candidate models in priority order (exact names, NO "models/" prefix)
    const candidateModels = [
      process.env.GEMINI_MODEL || 'gemini-1.5-flash',
      'gemini-1.5-pro',
      'gemini-pro',
      'gemini-2.5-flash',
      'gemini-flash-latest'
    ];

    let lastError: any = null;

    for (const modelName of candidateModels) {
      try {
        // Exact model instantiation without extra "models/" prefix
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const responseText = result.response.text().trim();

        // Extract JSON in case of extra conversational characters
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error(`AI response from ${modelName} did not contain valid JSON format`);
        }

        const parsedData: AIEligibilityResult = JSON.parse(jsonMatch[0]);
        console.log(`[AIService] ✅ Successfully assessed eligibility using model: ${modelName}`);
        return parsedData;
      } catch (error: any) {
        lastError = error;
        console.warn(`[AIService] ⚠️ Model '${modelName}' failed: ${error?.message || error}. Trying fallback...`);
        // Continue loop to try next model tier
      }
    }

    // Safe error reporting if all candidate models fail
    console.error('\n--- [AIService] GEMINI API ERROR ---');
    console.error('All model attempts failed. Last error:', lastError?.message || lastError);
    console.error('------------------------------------\n');
    throw new AppError(500, 'AI_SERVICE_ERROR', lastError?.message || 'Gemini AI assessment service failed across all available models');
  }
}
