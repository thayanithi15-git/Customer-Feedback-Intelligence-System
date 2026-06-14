import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/feedback_intelligence';

console.log('--- QuickCart Customer Feedback Intelligence Database Setup ---');
console.log(`Target MongoDB URI: ${MONGODB_URI}\n`);

// 1. Define the Schema
const FeedbackSchema = new mongoose.Schema({
  rawId: { type: String, required: true },
  rawTimestamp: { type: String, default: '' },
  rawSource: { type: String, required: true },
  rawRating: { type: String, default: '' },
  rawFeedbackText: { type: String, required: true },
  
  // Cleaned Fields
  timestamp: { type: Date, default: null },
  source: { type: String, enum: ['support_ticket', 'app_store_review', 'survey_comment'], required: true },
  rating: { type: Number, min: 1, max: 5, default: null },
  feedbackText: { type: String, required: true },
  cleanedText: { type: String, required: true },

  // Enriched Fields
  sentiment: { type: String, enum: ['positive', 'negative', 'neutral'], required: true },
  category: { type: String, enum: ['Billing', 'App Bug', 'Delivery', 'Staff/Support', 'Other'], required: true },
  summary: { type: String, required: true },
  
  // Metadata & Flags
  language: { type: String, default: 'en' },
  isSarcastic: { type: Boolean, default: false },
  isDuplicate: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

// Define Indexes
FeedbackSchema.index({ timestamp: -1 });
FeedbackSchema.index({ category: 1, sentiment: 1 });
FeedbackSchema.index({ rawId: 1 }, { unique: true });

const Feedback = mongoose.model('Feedback', FeedbackSchema);

async function runSetup() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Successfully connected to MongoDB.');

    // Print existing counts
    const count = await Feedback.countDocuments();
    console.log(`Current documents in "feedbacks" collection: ${count}`);

    // If empty, seed a verification sample document
    if (count === 0) {
      console.log('Inserting initial database verification document...');
      const sample = new Feedback({
        rawId: "0000",
        rawTimestamp: "14-Jun-2026",
        rawSource: "survey_comment",
        rawRating: "5",
        rawFeedbackText: "Verification: Database set up successfully! App works perfectly.",
        timestamp: new Date(),
        source: "survey_comment",
        rating: 5,
        feedbackText: "Verification: Database set up successfully! App works perfectly.",
        cleanedText: "Verification: Database set up successfully! App works perfectly.",
        sentiment: "positive",
        category: "Other",
        summary: "Database verification sample",
        language: "en",
        isSarcastic: false
      });
      await sample.save();
      console.log('✓ Seeded verification document successfully.');
    }

    console.log('\n--- Database Indexes Configured ---');
    const indexes = await Feedback.collection.indexes();
    console.log(JSON.stringify(indexes, null, 2));

    console.log('\n✓ MongoDB Database and Collections setup is complete and healthy!');
    process.exit(0);
  } catch (error) {
    console.error('✗ MongoDB Setup Error:', error.message);
    process.exit(1);
  }
}

runSetup();
