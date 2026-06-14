import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
console.log('Using API key:', apiKey ? apiKey.substring(0, 10) + '...' : 'none');

async function test() {
  const genAI = new GoogleGenerativeAI(apiKey);
  
  // Let's try gemini-1.5-flash
  try {
    console.log('Trying gemini-1.5-flash...');
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const response = await model.generateContent('Hello');
    console.log('Success gemini-1.5-flash:', response.response.text());
  } catch (err) {
    console.error('Error gemini-1.5-flash:', err);
  }

  // Let's try gemini-2.5-flash
  try {
    console.log('Trying gemini-2.5-flash...');
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const response = await model.generateContent('Hello');
    console.log('Success gemini-2.5-flash:', response.response.text());
  } catch (err) {
    console.error('Error gemini-2.5-flash:', err);
  }

  // Let's try gemini-1.5-pro
  try {
    console.log('Trying gemini-1.5-pro...');
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
    const response = await model.generateContent('Hello');
    console.log('Success gemini-1.5-pro:', response.response.text());
  } catch (err) {
    console.error('Error gemini-1.5-pro:', err);
  }
}

test();
