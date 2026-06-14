import mongoose from 'mongoose';

/**
 * MongoDB Schema Specification for Customer Feedback Intelligence System (CFIS)
 * 
 * Collection Name: feedbacks
 */

const FeedbackSchema = new mongoose.Schema({
  // --- Raw Data Fields ---
  // Storing original inputs before any transformation or cleaning for full audit trail
  rawId: {
    type: String,
    required: [true, 'Raw ID is required'],
    index: true
  },
  rawTimestamp: {
    type: String,
    default: ''
  },
  rawSource: {
    type: String,
    required: [true, 'Raw source is required'],
    enum: ['support_ticket', 'app_store_review', 'survey_comment']
  },
  rawRating: {
    type: String,
    default: ''
  },
  rawFeedbackText: {
    type: String,
    required: [true, 'Raw feedback text is required']
  },
  
  // --- Cleaned & Standardized Fields ---
  // Cleaned and normalized fields derived during the ETL (Ingestion) phase
  timestamp: {
    type: Date,
    default: null,
    index: true
  },
  source: {
    type: String,
    enum: ['support_ticket', 'app_store_review', 'survey_comment'],
    required: true,
    index: true
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: null
  },
  feedbackText: {
    type: String,
    required: true
  },
  cleanedText: {
    type: String, // Text with agent details, order numbers, and boilerplate signatures stripped
    required: true
  },

  // --- AI Enriched Fields ---
  // Derived via LLM (Gemini 1.5 Flash) batch analysis
  sentiment: {
    type: String,
    enum: ['positive', 'negative', 'neutral'],
    required: [true, 'Sentiment classification is required'],
    index: true
  },
  category: {
    type: String,
    enum: ['Billing', 'App Bug', 'Delivery', 'Staff/Support', 'Other'],
    required: [true, 'Category classification is required'],
    index: true
  },
  summary: {
    type: String,
    required: [true, 'One-line summary is required']
  },
  
  // --- Metadata & Flags ---
  language: {
    type: String,
    default: 'en' // Detected language (e.g., 'es' for Spanish, 'fr' for French, 'hi' for Hinglish)
  },
  isSarcastic: {
    type: Boolean,
    default: false // Set to true if LLM detects sarcasm
  },
  isDuplicate: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// --- Performance Database Indexes ---
FeedbackSchema.index({ timestamp: -1 });
FeedbackSchema.index({ category: 1, sentiment: 1 });
FeedbackSchema.index({ rawId: 1 }, { unique: true });

// Export the Mongoose model
const Feedback = mongoose.models.Feedback || mongoose.model('Feedback', FeedbackSchema);

export default Feedback;
