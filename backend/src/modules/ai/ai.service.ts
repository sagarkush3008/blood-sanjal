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
   * Clinical fallback engine when AI service is unavailable, unconfigured, or rate-limited.
   * Strictly adheres to WHO, Red Cross, and Narayani Hospital clinical guidelines.
   */
  public static calculateRuleBasedEligibility(healthData: HealthData): AIEligibilityResult {
    const now = new Date();
    const lastDate = healthData.lastDonationDate ? new Date(healthData.lastDonationDate) : new Date(0);
    const msSinceDonation = now.getTime() - lastDate.getTime();
    const daysSinceDonation = isNaN(msSinceDonation) ? 999 : Math.floor(msSinceDonation / (1000 * 60 * 60 * 24));
    const requiredWaitDays = healthData.gender === 'FEMALE' ? 120 : 90;

    // 1. Age Restrictions
    if (healthData.age < 18) {
      return {
        isEligible: false,
        nextEligibleDate: '2099-12-31',
        aiTips: [
          'You must be at least 18 years of age to legally and safely donate blood.',
          'Focus on eating iron-rich foods such as lentils, spinach, and beans.',
          'Stay well-hydrated with 2-3 liters of clean water daily.'
        ]
      };
    }
    if (healthData.age > 65) {
      return {
        isEligible: false,
        nextEligibleDate: '2099-12-31',
        aiTips: [
          'Donors over 65 require special medical evaluation from a registered physician.',
          'Maintain regular moderate physical activity such as morning walking.',
          'Consider contributing as an advocate or volunteer coordinator in community blood camps.'
        ]
      };
    }

    // 2. Weight Requirement
    if (healthData.weightKg < 45) {
      return {
        isEligible: false,
        nextEligibleDate: '2099-12-31',
        aiTips: [
          'Minimum weight requirement is 45 kg to ensure safe blood volume conservation.',
          'Eat a balanced diet rich in wholesome proteins, complex carbs, and healthy fats.',
          'Consult a physician or dietitian to achieve a healthy body weight.'
        ]
      };
    }

    // 3. Pregnancy Deferral
    if (healthData.isPregnant) {
      const pregnancyDate = new Date(now.getTime() + 180 * 86400000);
      return {
        isEligible: false,
        nextEligibleDate: pregnancyDate.toISOString().split('T')[0],
        aiTips: [
          'Blood donation is deferred during pregnancy and for 6 months postpartum.',
          'Ensure optimal iron and folic acid intake as prescribed by your doctor.',
          'Maintain adequate rest and regular prenatal checkups.'
        ]
      };
    }

    // 4. Major Surgery Deferral
    if (healthData.hasSurgery) {
      const surgeryDate = new Date(now.getTime() + 180 * 86400000);
      return {
        isEligible: false,
        nextEligibleDate: surgeryDate.toISOString().split('T')[0],
        aiTips: [
          'Recent major surgeries require a 6-month healing and recovery deferral.',
          'Allow your red blood cell count and hemoglobin levels to fully normalize.',
          'Avoid strenuous physical exertion until cleared by your surgical team.'
        ]
      };
    }

    // 5. Recent Tattoos or Piercings
    if (healthData.recentTattoos) {
      const tattooDate = new Date(now.getTime() + 180 * 86400000);
      return {
        isEligible: false,
        nextEligibleDate: tattooDate.toISOString().split('T')[0],
        aiTips: [
          'Recent tattoos and body piercings require a 6-month safety observation deferral.',
          'Keep tattooed skin clean and protected from direct sunlight.',
          'We welcome you back to donate as soon as the 6-month safety period elapses.'
        ]
      };
    }

    // 6. Recent Antibiotic Course
    if (healthData.recentAntibiotics) {
      const antibioticDate = new Date(now.getTime() + 14 * 86400000);
      return {
        isEligible: false,
        nextEligibleDate: antibioticDate.toISOString().split('T')[0],
        aiTips: [
          'Must be completely symptom-free and done with antibiotics for at least 14 days.',
          'Complete the entire medication regimen prescribed by your healthcare provider.',
          'Drink plenty of fluids to assist your body in clearing metabolic waste.'
        ]
      };
    }

    // 7. Standard 90/120 Day Cooldown
    if (daysSinceDonation < requiredWaitDays) {
      const remainingDays = requiredWaitDays - daysSinceDonation;
      const nextDate = new Date(lastDate.getTime() + requiredWaitDays * 86400000);
      return {
        isEligible: false,
        nextEligibleDate: nextDate.toISOString().split('T')[0],
        aiTips: [
          `You are in the medical recovery period (${remainingDays} days remaining of your ${requiredWaitDays}-day cycle).`,
          'Replenish iron stores by consuming pomegranate, beetroot, spinach, and jaggery.',
          'Stay well-hydrated with 8-10 glasses of water daily.'
        ]
      };
    }

    // 8. Fully Eligible
    return {
      isEligible: true,
      nextEligibleDate: null,
      aiTips: [
        'You meet all physiological and medical criteria for voluntary blood donation! 🩸',
        'Drink at least 500ml of water 15-30 minutes before your donation session.',
        'Enjoy a nutritious meal 2-3 hours beforehand, and avoid fatty or fried foods.'
      ]
    };
  }

  /**
   * Analyzes blood donation eligibility using Google Gemini Generative AI,
   * with automatic fallback across multiple model tiers, followed by a clinical rule engine.
   */
  public static async analyzeDonationEligibility(healthData: HealthData): Promise<AIEligibilityResult> {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.warn('[AIService] ⚠️ GEMINI_API_KEY not found in environment. Using clinical rule engine fallback.');
      return this.calculateRuleBasedEligibility(healthData);
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const prompt = `
      Evaluate blood donation eligibility. 
      User: Age ${healthData.age}, Gender ${healthData.gender}, Weight ${healthData.weightKg}kg, Tattoo ${healthData.recentTattoos}, Antibiotics ${healthData.recentAntibiotics}, Pregnant ${healthData.isPregnant}, Surgery ${healthData.hasSurgery}, Last Donation ${healthData.lastDonationDate}. 
      
      Rules: 
      - Age <18 or >65, Weight <45, Pregnant, or Surgery = totally ineligible (nextEligibleDate can be a distant future date like 9999-12-31, isEligible must be false). 
      - Tattoo = 6 months wait. 
      - Antibiotics = 14 days wait. 
      - Default wait = 90 days (males) / 120 days (females). 
      
      Calculate absolute nextEligibleDate (YYYY-MM-DD). Provide 3 personalized aiTips.

      CRITICAL: You MUST return your response STRICTLY as a valid JSON object without any markdown wrapping, code blocks, or extra text.
      Format:
      {
        "isEligible": boolean,
        "nextEligibleDate": "YYYY-MM-DD",
        "aiTips": ["Tip 1", "Tip 2", "Tip 3"]
      }
    `;

    const candidateModels = [
      process.env.GEMINI_MODEL || 'gemini-1.5-flash',
      'gemini-1.5-pro',
      'gemini-pro',
      'gemini-2.5-flash',
    ];

    let lastError: any = null;

    for (const modelName of candidateModels) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const responseText = result.response.text().trim();

        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error(`AI response from ${modelName} did not contain valid JSON`);
        }

        const parsedData: AIEligibilityResult = JSON.parse(jsonMatch[0]);
        console.log(`[AIService] ✅ Successfully assessed eligibility using Gemini model: ${modelName}`);
        return parsedData;
      } catch (error: any) {
        lastError = error;
        console.warn(`[AIService] ⚠️ Model '${modelName}' failed (${error?.message || error}). Trying next model...`);
      }
    }

    console.warn(`[AIService] ⚠️ All Gemini models failed (${lastError?.message || lastError}). Engaging clinical rule engine fallback.`);
    return this.calculateRuleBasedEligibility(healthData);
  }
}
