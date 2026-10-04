const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function test() {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    console.log('Using API KEY:', apiKey.substring(0, 10) + '...');
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();
    console.log('Models available:', data);
  } catch (err) {
    console.error('ERROR:', err);
  }
}
test();
