import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;

console.log('🔍 Testing Gemini API Key connectivity...');
console.log('🔑 Key snippet:', apiKey ? `${apiKey.substring(0, 8)}...` : 'MISSING');

if (!apiKey) {
  console.error('❌ ERROR: GEMINI_API_KEY is not defined in server/.env file.');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function testGemini() {
  const modelsToTest = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-pro'];
  
  for (const modelName of modelsToTest) {
    try {
      console.log(`\n📡 Sending test request to model: "${modelName}"...`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent('Return JSON: {"status": "ok", "message": "Gemini API test success"}');
      const response = await result.response;
      const text = response.text();
      
      console.log(`✅ SUCCESS with model "${modelName}"!`);
      console.log('📄 Response Output:', text);
      return;
    } catch (err) {
      console.error(`⚠️ Failed with model "${modelName}":`, err.message);
    }
  }
}

testGemini();
