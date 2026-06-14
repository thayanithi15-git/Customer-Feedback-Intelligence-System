import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import csv from 'csv-parser';
import fs from 'fs';
import { Readable } from 'stream';
import Feedback from './models/Feedback.js';
import { parseDate, isMeaningless, cleanFeedbackText } from './utils/cleaner.js';
import { enrichFeedbackBatch } from './utils/enricher.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// In-memory job status for tracking pipeline progress
let uploadJob = {
  status: 'idle', // 'idle', 'processing', 'completed', 'failed'
  progress: 0,
  processed: 0,
  total: 0,
  duplicatesRemoved: 0,
  meaninglessRemoved: 0,
  error: null
};

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/feedback_intelligence')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Multer config for file upload
const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB limit

app.get('/api/status', (req, res) => {
  res.json(uploadJob);
});

// Reset status if idle
app.post('/api/status/reset', (req, res) => {
  uploadJob = {
    status: 'idle',
    progress: 0,
    processed: 0,
    total: 0,
    duplicatesRemoved: 0,
    meaninglessRemoved: 0,
    error: null
  };
  res.json(uploadJob);
});

// POST: Upload raw CSV
app.post('/api/upload', upload.single('file'), async (req, res) => {
  if (!req.file && !req.body.useLocal) {
    return res.status(400).json({ error: 'Please upload a CSV file or check useLocal.' });
  }

  if (uploadJob.status === 'processing') {
    return res.status(400).json({ error: 'A file is already being processed.' });
  }

  // Determine source of CSV
  let csvBuffer;
  if (req.body.useLocal) {
    try {
      const localPath = 'e:\\New One\\customer_feedback_raw.csv';
      csvBuffer = fs.readFileSync(localPath);
    } catch (err) {
      return res.status(400).json({ error: `Could not find local file: ${err.message}` });
    }
  } else {
    csvBuffer = req.file.buffer;
  }

  // Initialize status
  uploadJob = {
    status: 'processing',
    progress: 0,
    processed: 0,
    total: 0,
    duplicatesRemoved: 0,
    meaninglessRemoved: 0,
    error: null
  };

  // Start processing in background so request does not time out
  processCSVInBackground(csvBuffer).catch(err => {
    console.error('Error in background processing:', err);
    uploadJob.status = 'failed';
    uploadJob.error = err.message;
  });

  res.json({ message: 'File processing started.', status: 'processing' });
});

async function processCSVInBackground(buffer) {
  const rawRows = [];
  
  // Parse CSV
  await new Promise((resolve, reject) => {
    const stream = Readable.from(buffer.toString('utf-8'));
    stream.pipe(csv())
      .on('data', (data) => rawRows.push(data))
      .on('end', resolve)
      .on('error', reject);
  });

  uploadJob.total = rawRows.length;
  console.log(`Parsed ${rawRows.length} raw rows from CSV.`);

  // Step 1: Cleaning & Deduplication
  const seenIds = new Set();
  const seenTexts = new Set();
  const cleanedRows = [];

  for (const row of rawRows) {
    const id = (row.id || '').trim();
    const rawFeedback = row.feedback_text || '';
    
    // Check meaningless row
    if (isMeaningless(rawFeedback)) {
      uploadJob.meaninglessRemoved++;
      continue;
    }

    const cleanedText = cleanFeedbackText(rawFeedback);

    // Filter genuine duplicates
    // Standardize text comparison by removing spaces and lowercase
    const normalizedTextForDup = cleanedText.toLowerCase().replace(/\s+/g, '');
    
    if (seenIds.has(id) || seenTexts.has(normalizedTextForDup)) {
      uploadJob.duplicatesRemoved++;
      continue;
    }

    if (id) seenIds.add(id);
    if (normalizedTextForDup) seenTexts.add(normalizedTextForDup);

    // Save cleaned representation
    cleanedRows.push({
      rawId: id,
      rawTimestamp: row.timestamp || '',
      rawSource: row.source || 'survey_comment',
      rawRating: row.rating || '',
      rawFeedbackText: rawFeedback,
      // Parsed fields
      timestamp: parseDate(row.timestamp),
      source: ['support_ticket', 'app_store_review', 'survey_comment'].includes(row.source) 
        ? row.source 
        : 'survey_comment',
      rating: row.rating ? parseInt(row.rating, 10) : undefined,
      cleanedText: cleanedText,
      feedbackText: cleanedText // Placeholder, will be updated with translated text if any
    });
  }

  console.log(`Cleaning step done. Cleaned rows: ${cleanedRows.length}. Duplicates removed: ${uploadJob.duplicatesRemoved}. Meaningless removed: ${uploadJob.meaninglessRemoved}`);
  
  // Step 2: AI Enrichment (Gemini)
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not defined in the backend environment variables.');
  }

  // Clear existing records before saving new ones
  await Feedback.deleteMany({});

  uploadJob.status = 'enriching';
  
  const enrichedRows = await enrichFeedbackBatch(cleanedRows, {
    apiKey,
    provider: 'gemini',
    batchSize: 25
  }, (processed, total) => {
    uploadJob.processed = processed;
    uploadJob.progress = Math.round((processed / total) * 100);
    console.log(`Enrichment progress: ${processed}/${total} (${uploadJob.progress}%)`);
  });

  // Step 3: Save to MongoDB
  console.log(`Saving ${enrichedRows.length} rows to database...`);
  await Feedback.insertMany(enrichedRows);

  uploadJob.status = 'completed';
  uploadJob.progress = 100;
  console.log('Background processing completed successfully.');
}

// GET: Feedback list (paginated, filtered, searchable)
app.get('/api/feedback', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search = '', 
      sentiment, 
      category, 
      source, 
      isSarcastic,
      language
    } = req.query;

    const query = {};

    if (search) {
      // Search rawId or feedbackText/summary
      query.$or = [
        { rawId: { $regex: search, $options: 'i' } },
        { feedbackText: { $regex: search, $options: 'i' } },
        { summary: { $regex: search, $options: 'i' } }
      ];
    }

    if (sentiment) query.sentiment = sentiment;
    if (category) query.category = category;
    if (source) query.source = source;
    if (isSarcastic !== undefined) query.isSarcastic = isSarcastic === 'true';
    if (language) query.language = language;

    const skipIndex = (page - 1) * limit;
    
    const [data, total] = await Promise.all([
      Feedback.find(query)
        .sort({ timestamp: -1, rawId: -1 })
        .skip(skipIndex)
        .limit(Number(limit)),
      Feedback.countDocuments(query)
    ]);

    res.json({
      data,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
      totalCount: total
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET: Dashboard Stats & Analytics
app.get('/api/dashboard', async (req, res) => {
  try {
    const totalCount = await Feedback.countDocuments();
    if (totalCount === 0) {
      return res.json({
        totalCount: 0,
        sentimentBreakdown: [],
        categoryVolume: [],
        trendData: [],
        representativeExamples: {},
        averageRating: 0
      });
    }

    // 1. Sentiment Breakdown
    const sentimentAgg = await Feedback.aggregate([
      { $group: { _id: '$sentiment', count: { $sum: 1 } } }
    ]);
    const sentimentBreakdown = sentimentAgg.map(item => ({
      sentiment: item._id,
      count: item.count,
      percentage: Number(((item.count / totalCount) * 100).toFixed(1))
    }));

    // 2. Category Volume
    const categoryAgg = await Feedback.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    const categoryVolume = categoryAgg.map(item => ({
      category: item._id,
      count: item.count,
      percentage: Number(((item.count / totalCount) * 100).toFixed(1))
    }));

    // Average rating
    const ratingAgg = await Feedback.aggregate([
      { $match: { rating: { $exists: true, $ne: null } } },
      { $group: { _id: null, avgRating: { $avg: '$rating' } } }
    ]);
    const averageRating = ratingAgg.length > 0 ? Number(ratingAgg[0].avgRating.toFixed(2)) : 0;

    // Sarcasm count
    const sarcasmCount = await Feedback.countDocuments({ isSarcastic: true });

    // 3. Trend Over Time (grouped by week/day)
    // In our CSV we have feedback spanning mostly Jan to March 2024. Let's group by week.
    const trendAgg = await Feedback.aggregate([
      { 
        $match: { 
          timestamp: { $exists: true, $ne: null } 
        } 
      },
      {
        $group: {
          _id: {
            year: { $year: '$timestamp' },
            week: { $week: '$timestamp' }
          },
          avgRating: { $avg: '$rating' },
          positiveCount: {
            $sum: { $cond: [{ $eq: ['$sentiment', 'positive'] }, 1, 0] }
          },
          totalCount: { $sum: 1 },
          date: { $min: '$timestamp' }
        }
      },
      { $sort: { '_id.year': 1, '_id.week': 1 } }
    ]);

    const trendData = trendAgg.map(item => ({
      date: item.date.toISOString().split('T')[0],
      avgRating: item.avgRating ? Number(item.avgRating.toFixed(2)) : null,
      positiveRatio: Number(((item.positiveCount / item.totalCount) * 100).toFixed(1)),
      volume: item.totalCount
    }));

    // 4. Representative Examples for top categories
    // Get top 3 complaints (negative or representative) per category
    const categoriesList = ['Billing', 'App Bug', 'Delivery', 'Staff/Support', 'Other'];
    const representativeExamples = {};

    for (const cat of categoriesList) {
      const examples = await Feedback.find({ category: cat, sentiment: 'negative' })
        .limit(3)
        .select('rawId feedbackText summary source rating isSarcastic');
      
      representativeExamples[cat] = examples;
    }

    res.json({
      totalCount,
      sarcasmCount,
      averageRating,
      sentimentBreakdown,
      categoryVolume,
      trendData,
      representativeExamples
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET: Export Database to CSV
app.get('/api/export', async (req, res) => {
  try {
    const feedbacks = await Feedback.find().sort({ timestamp: -1 });
    
    let csvContent = 'id,timestamp,source,rating,feedback_text,sentiment,category,summary,is_sarcastic,language\n';
    
    for (const f of feedbacks) {
      const cleanText = (f.feedbackText || '').replace(/"/g, '""');
      const cleanSummary = (f.summary || '').replace(/"/g, '""');
      const dateStr = f.timestamp ? f.timestamp.toISOString() : '';
      csvContent += `${f.rawId},"${dateStr}","${f.source}",${f.rating || ''},"${cleanText}","${f.sentiment}","${f.category}","${cleanSummary}",${f.isSarcastic},"${f.language}"\n`;
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=customer_feedback_cleaned_enriched.csv');
    res.status(200).send(csvContent);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
