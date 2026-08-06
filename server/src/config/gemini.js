import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

let genAI = null;
let geminiModel = null;

const apiKey = process.env.GEMINI_API_KEY;

if (apiKey) {
  try {
    genAI = new GoogleGenerativeAI(apiKey);
    geminiModel = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        responseMimeType: 'application/json'
      }
    });
    console.log('✅ Google Gemini AI Model (gemini-1.5-flash) Initialized');
  } catch (err) {
    console.warn('⚠️ Gemini initialization warning:', err.message);
  }
} else {
  console.warn('ℹ️ GEMINI_API_KEY is unset. AegisMind standard rule engine fallback will handle telemetry parsing.');
}

export { geminiModel };
