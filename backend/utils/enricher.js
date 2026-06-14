import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Enriches a batch of feedback records using Google Gemini API
 * @param {Array} records - Array of records: { index, text, rawRating, source }
 * @param {string} apiKey - Gemini API key
 * @returns {Promise<Array>} - Enriched results matching the index
 */
async function enrichWithGemini(records, apiKey) {
  const genAI = new GoogleGenerativeAI(apiKey);
  // Using gemini-1.5-flash as it is fast, cheap and highly capable for JSON tasks
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    generationConfig: { responseMimeType: 'application/json' }
  });

  const prompt = `
You are an expert customer feedback analyzer for "QuickCart", a food and grocery delivery app.
Analyze the following list of customer feedback entries.

For each entry, determine:
1. sentiment: Must be exactly "positive", "negative", or "neutral". Note: Sarcasm (e.g., "Oh great, crashed again, love it" or "Wonderful, charged me twice, exactly what I wanted today") must be classified as "negative".
2. category: Must be exactly one of: "Billing", "App Bug", "Delivery", "Staff/Support", "Other". Do not invent new categories.
   - "Billing": payment issues, duplicate charges, refund delays, subscription fees, coupons not applying.
   - "App Bug": login issues, app crashes, buttons not working, freezing screens, cart issues, UI bugs, address saving problems.
   - "Delivery": late order, cold food, missing items, damaged packaging, driver can't find address.
   - "Staff/Support": rude delivery person, helpful/unhelpful chat support agents, no reply from support.
   - "Other": general comments, feature requests (like adding vegan options), design comments (nice logo), irrelevant questions.
3. summary: A short, concise one-line summary in plain English of the core issue.
4. language: The original language code (e.g. "en" for English, "es" for Spanish, "fr" for French, "hi" for Hindi/Hinglish).
5. translatedText: If the original language is not English, translate it to English. Otherwise, return the original text.
6. isSarcastic: A boolean (true/false) indicating if the user is using sarcasm/irony.

Input records:
${JSON.stringify(records, null, 2)}

Return a JSON array of objects, each containing:
{
  "index": number,
  "sentiment": "positive" | "negative" | "neutral",
  "category": "Billing" | "App Bug" | "Delivery" | "Staff/Support" | "Other",
  "summary": "string",
  "language": "string",
  "translatedText": "string",
  "isSarcastic": boolean
}
`;

  try {
    const result = await model.generateContent(prompt);
    const textResponse = result.response.text();
    const parsed = JSON.parse(textResponse);
    return parsed;
  } catch (error) {
    console.error('Gemini API Error details:', error);
    throw error;
  }
}

/**
 * Enriches feedback records by batching them
 * @param {Array} cleanedRecords - Array of { rawId, rawTimestamp, rawSource, rawRating, rawFeedbackText, cleanedText }
 * @param {Object} config - { apiKey, provider, batchSize }
 * @param {Function} onProgress - Progress callback function (processedCount, totalCount)
 */
export async function enrichFeedbackBatch(cleanedRecords, config, onProgress) {
  const { apiKey, provider = 'gemini', batchSize = 25 } = config;

  if (!apiKey) {
    throw new Error('API Key is required for enrichment.');
  }

  const results = [];
  const total = cleanedRecords.length;

  for (let i = 0; i < total; i += batchSize) {
    const batch = cleanedRecords.slice(i, i + batchSize).map((rec, idx) => ({
      index: i + idx,
      id: rec.rawId,
      text: rec.cleanedText, // Use text with agent/order signatures removed
      rawRating: rec.rawRating,
      source: rec.rawSource
    }));

    let batchResults = [];
    let retries = 3;

    while (retries > 0) {
      try {
        if (provider === 'gemini') {
          batchResults = await enrichWithGemini(batch, apiKey);
        } else {
          throw new Error(`Unsupported provider: ${provider}`);
        }
        break;
      } catch (err) {
        retries--;
        console.warn(`Error processing batch starting at ${i}. Retries left: ${retries}. Error: ${err.message}`);
        if (retries === 0) {
          // Fallback if AI fails completely for this batch
          batchResults = batch.map(b => ({
            index: b.index,
            sentiment: b.rawRating && parseInt(b.rawRating) >= 4 ? 'positive' : (b.rawRating && parseInt(b.rawRating) <= 2 ? 'negative' : 'neutral'),
            category: 'Other',
            summary: b.text.substring(0, 60),
            language: 'en',
            translatedText: b.text,
            isSarcastic: false
          }));
        } else {
          // Wait before retry
          await new Promise(res => setTimeout(res, 2000));
        }
      }
    }

    // Merge batch results back to order
    for (const res of batchResults) {
      const originalRecord = cleanedRecords[res.index];
      if (originalRecord) {
        results.push({
          ...originalRecord,
          sentiment: res.sentiment,
          category: res.category,
          summary: res.summary,
          language: res.language || 'en',
          feedbackText: res.translatedText || originalRecord.cleanedText, // Save the English version as primary feedbackText
          isSarcastic: res.isSarcastic || false
        });
      }
    }

    if (onProgress) {
      onProgress(Math.min(i + batchSize, total), total);
    }
  }

  return results;
}
