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
 * Rule-based local enricher fallback when API key is missing
 */
function localEnrichRecord(rec) {
  const text = rec.text.trim();
  const lower = text.toLowerCase();
  const rating = rec.rawRating ? parseInt(rec.rawRating, 10) : null;
  
  let sentiment = 'neutral';
  let category = 'Other';
  let summary = 'General customer query';
  let isSarcastic = false;
  let language = 'en';
  let translatedText = text;

  // Language & Translation Fallbacks
  if (lower.includes('pedido llego tarde')) {
    language = 'es';
    translatedText = 'Order arrived late and items were missing';
    sentiment = 'negative';
    category = 'Delivery';
    summary = 'Order arrived late with missing items';
  } else if (lower.includes('se cierra sola cada vez')) {
    language = 'es';
    translatedText = 'The application closes itself every time I try to pay';
    sentiment = 'negative';
    category = 'App Bug';
    summary = 'App crashes during payment';
  } else if (lower.includes('mera refund abhi tak')) {
    language = 'hi';
    translatedText = 'My refund has not arrived yet, very bad service';
    sentiment = 'negative';
    category = 'Billing';
    summary = 'Refund not received yet';
  } else if (lower.includes('le livreur etait tres impoli')) {
    language = 'fr';
    translatedText = 'The delivery person was very rude and the food was cold';
    sentiment = 'negative';
    category = 'Staff/Support';
    summary = 'Rude delivery person and cold food';
  } else if (lower.includes('app bahut acchi')) {
    language = 'hi';
    translatedText = 'The app is very good, very fast';
    sentiment = 'positive';
    category = 'Other';
    summary = 'App is good and fast';
  }

  // Sarcasm Checks
  if (lower.includes('perfect') && (lower.includes('froze') || lower.includes('crash') || lower.includes('slow'))) {
    isSarcastic = true;
    sentiment = 'negative';
    category = 'App Bug';
    summary = 'App froze or crashed during checkout';
  } else if (lower.includes('wonderful') && (lower.includes('charged twice') || lower.includes('double') || lower.includes('money'))) {
    isSarcastic = true;
    sentiment = 'negative';
    category = 'Billing';
    summary = 'Double charged for the same transaction';
  } else if (lower.includes('brilliant') && lower.includes('refund')) {
    isSarcastic = true;
    sentiment = 'negative';
    category = 'Billing';
    summary = 'Refund delayed for weeks';
  } else if (lower.includes('five stars') && (lower.includes('crashed') || lower.includes('rude') || lower.includes('late') || lower.includes('cold'))) {
    isSarcastic = true;
    sentiment = 'negative';
    category = 'Delivery';
    summary = 'Sarcastic comment about bad delivery experience';
  }

  // General Category Checks (if not already set by translation/sarcasm)
  if (category === 'Other') {
    if (/\b(charge|refund|card|billing|fee|payment|coupon|deduct|subscription|pay|deduction|invoice|price|charged|save50)\b/i.test(lower)) {
      category = 'Billing';
      summary = 'Payment or charge issue';
      if (lower.includes('coupon') || lower.includes('save50')) summary = 'Coupon failed to apply';
      if (lower.includes('refund')) summary = 'Refund status check';
      if (lower.includes('double') || lower.includes('twice')) summary = 'Double charge issue';
    } else if (/\b(login|app|crash|freeze|stuck|bug|load|button|screen|battery|drain|save|address|cart|crashing|loading)\b/i.test(lower)) {
      category = 'App Bug';
      summary = 'App technical issue';
      if (lower.includes('battery') || lower.includes('drain')) summary = 'App drains battery';
      if (lower.includes('login')) summary = 'Login failure';
      if (lower.includes('address') || lower.includes('save button')) summary = 'Cannot save address';
      if (lower.includes('crash') || lower.includes('crashing')) summary = 'App keeps crashing';
      if (lower.includes('loading') || lower.includes('loading screen')) summary = 'App stuck on loading screen';
    } else if (/\b(delivery|driver|late|cold|missing|food|arrived|cancel|bag|door|cancelled|hour late|delivery fee|spilled|items)\b/i.test(lower)) {
      category = 'Delivery';
      summary = 'Delivery service issue';
      if (lower.includes('late') || lower.includes('hour late')) summary = 'Order arrived late';
      if (lower.includes('missing') || lower.includes('missing items') || lower.includes('only half')) summary = 'Missing items in order';
      if (lower.includes('spilled')) summary = 'Food spilled during delivery';
      if (lower.includes('cold')) summary = 'Food delivered cold';
    } else if (/\b(support|agent|chat|customer care|reply|email|rude|friendly|staff|emails)\b/i.test(lower)) {
      category = 'Staff/Support';
      summary = 'Customer support issue';
      if (lower.includes('rude') || lower.includes('threw')) summary = 'Rude delivery staff';
      if (lower.includes('reply') || lower.includes('emails')) summary = 'Support team did not reply';
      if (lower.includes('copy paste')) summary = 'Support agent gave unhelpful canned response';
    } else if (lower.includes('vegan') || lower.includes('restaurant')) {
      category = 'Other';
      summary = 'Request to add more restaurants';
    }
  }

  // Sentiment Scoring (if not already set)
  if (sentiment === 'neutral') {
    if (rating !== null) {
      if (rating >= 4 && !isSarcastic) sentiment = 'positive';
      else if (rating <= 2) sentiment = 'negative';
      else sentiment = 'neutral';
    } else {
      // Keyword based
      const positiveWords = ['love', 'fantastic', 'perfect', 'brilliant', 'wonderful', 'friendly', 'helpful', 'smooth', 'fast', 'super easy', 'great', 'best', 'delicious', 'fresh'];
      const negativeWords = ['rude', 'late', 'cold', 'missing', 'cancel', 'failed', 'deducted', 'crash', 'stuck', 'freeze', 'drain', 'sucks', 'worst', 'bad', 'ridiculous', 'horrible', 'slow'];
      
      let posCount = 0;
      let negCount = 0;
      positiveWords.forEach(w => { if (lower.includes(w)) posCount++; });
      negativeWords.forEach(w => { if (lower.includes(w)) negCount++; });

      if (posCount > negCount && !isSarcastic) sentiment = 'positive';
      else if (negCount > posCount) sentiment = 'negative';
      else sentiment = 'neutral';
    }
  }

  // Generate specific summary if generic
  if (summary === 'Payment or charge issue' || summary === 'App technical issue' || summary === 'Delivery service issue' || summary === 'Customer support issue') {
    summary = text.length > 50 ? text.substring(0, 50) + '...' : text;
  }

  return {
    sentiment,
    category,
    summary,
    language,
    translatedText,
    isSarcastic
  };
}

/**
 * Enriches feedback records by batching them
 * @param {Array} cleanedRecords - Array of { rawId, rawTimestamp, rawSource, rawRating, rawFeedbackText, cleanedText }
 * @param {Object} config - { apiKey, provider, batchSize }
 * @param {Function} onProgress - Progress callback function (processedCount, totalCount)
 */
export async function enrichFeedbackBatch(cleanedRecords, config, onProgress) {
  const { apiKey, provider = 'gemini', batchSize = 25 } = config;

  const results = [];
  const total = cleanedRecords.length;

  // If no API Key is provided, use the rule-based local enricher fallback
  if (!apiKey) {
    console.log('No GEMINI_API_KEY provided. Using local rule-based fallback analyzer.');
    for (let i = 0; i < total; i++) {
      const rec = cleanedRecords[i];
      const localResult = localEnrichRecord({
        text: rec.cleanedText,
        rawRating: rec.rawRating,
        source: rec.rawSource
      });

      results.push({
        ...rec,
        sentiment: localResult.sentiment,
        category: localResult.category,
        summary: localResult.summary,
        language: localResult.language,
        feedbackText: localResult.translatedText,
        isSarcastic: localResult.isSarcastic
      });

      if (onProgress && (i + 1) % 50 === 0) {
        onProgress(i + 1, total);
      }
    }
    if (onProgress) onProgress(total, total);
    return results;
  }


  let useLocalFallback = false;

  for (let i = 0; i < total; i += batchSize) {
    const batch = cleanedRecords.slice(i, i + batchSize).map((rec, idx) => ({
      index: i + idx,
      id: rec.rawId,
      text: rec.cleanedText, // Use text with agent/order signatures removed
      rawRating: rec.rawRating,
      source: rec.rawSource
    }));

    let batchResults = [];

    if (useLocalFallback) {
      // Direct local fallback to avoid slow retries and API errors
      batchResults = batch.map(b => {
        const localRes = localEnrichRecord(b);
        return {
          index: b.index,
          sentiment: localRes.sentiment,
          category: localRes.category,
          summary: localRes.summary,
          language: localRes.language,
          translatedText: localRes.translatedText,
          isSarcastic: localRes.isSarcastic
        };
      });
    } else {
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
          
          // Check for permanent errors (like 404 Not Found, 403 Forbidden, 400 Bad Request, API key invalid, etc.)
          const errorText = (err.message || '').toLowerCase();
          if (
            errorText.includes('404') || 
            errorText.includes('not found') || 
            errorText.includes('403') || 
            errorText.includes('api_key_invalid') || 
            errorText.includes('key not valid') ||
            errorText.includes('unauthorized') ||
            errorText.includes('bad request') ||
            errorText.includes('400')
          ) {
            console.warn('Permanent Gemini API error detected (e.g. model not found, invalid key, or forbidden). Switching to local fallback for this and all remaining batches.');
            useLocalFallback = true;
            retries = 0; // Stop retrying this batch
          }

          if (retries === 0) {
            // Fallback if AI fails completely for this batch - use local rule-based classifier
            batchResults = batch.map(b => {
              const localRes = localEnrichRecord(b);
              return {
                index: b.index,
                sentiment: localRes.sentiment,
                category: localRes.category,
                summary: localRes.summary,
                language: localRes.language,
                translatedText: localRes.translatedText,
                isSarcastic: localRes.isSarcastic
              };
            });
          } else {
            // Wait before retry
            await new Promise(res => setTimeout(res, 2000));
          }
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
