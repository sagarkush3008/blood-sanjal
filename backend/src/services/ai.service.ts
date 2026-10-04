import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini with the specific API key (Ensure this is in your .env file)
const apiKey = process.env.GEMINI_API_KEY || 'AIzaSyDrIyAQon3RSuZXG-_4aWlBP_rUzNpWaLA';
const genAI = new GoogleGenerativeAI(apiKey);

export interface HealthMetrics {
  age: number;
  gender: string;
  weight: number;
  hbLevel?: number;
  lastDonationDate: string;
  recentTattoos: boolean;
  onAntibiotics: boolean;
}

export class AIService {
  static async analyzeEligibility(metrics: HealthMetrics) {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
    
    const prompt = `
      You are an expert hematologist AI. Analyze the following donor health metrics:
      - Age: ${metrics.age}
      - Gender: ${metrics.gender}
      - Weight: ${metrics.weight}kg
      - HB Level: ${metrics.hbLevel || 'Unknown'}
      - Last Donation Date: ${metrics.lastDonationDate}
      - Recent Tattoos (last 6 months): ${metrics.recentTattoos}
      - Currently on Antibiotics: ${metrics.onAntibiotics}

      Based on standard medical guidelines for blood donation:
      1. Calculate the exact next eligible date (YYYY-MM-DD). If they have recent tattoos or are on antibiotics, defer them accordingly (e.g., 6 months from tattoo date). Otherwise, use standard 90-120 day intervals.
      2. Provide exactly 3 short, personalized post-donation health recovery tips based on their specific metrics.
      
      Respond strictly in the following JSON format:
      {
        "nextEligibleDate": "YYYY-MM-DD",
        "isEligibleToday": boolean,
        "tips": ["Tip 1", "Tip 2", "Tip 3"]
      }
    `;

    try {
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      // Clean JSON if wrapped in markdown blocks
      const cleanJson = responseText.replace(/```json\n?|\n?```/g, '').trim();
      return JSON.parse(cleanJson);
    } catch (error) {
      console.error('Gemini Analysis Failed:', error);
      throw new Error('Failed to analyze health metrics');
    }
  }
}
