import mongoose from 'mongoose';

const FeedbackSchema = new mongoose.Schema({
  rawId: {
    type: String,
    required: true
  },
  rawTimestamp: {
    type: String
  },
  rawSource: {
    type: String,
    required: true
  },
  rawRating: {
    type: String
  },
  rawFeedbackText: {
    type: String,
    required: true
  },
  
  // Cleaned Fields
  timestamp: {
    type: Date
  },
  source: {
    type: String,
    enum: ['support_ticket', 'app_store_review', 'survey_comment'],
    required: true
  },
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  feedbackText: {
    type: String,
    required: true
  },
  cleanedText: {
    type: String // text with only boilerplate removed
  },

  // Enriched Fields
  sentiment: {
    type: String,
    enum: ['positive', 'negative', 'neutral'],
    required: true
  },
  category: {
    type: String,
    enum: ['Billing', 'App Bug', 'Delivery', 'Staff/Support', 'Other'],
    required: true
  },
  summary: {
    type: String,
    required: true
  },
  
  // Metadata
  language: {
    type: String,
    default: 'en'
  },
  isSarcastic: {
    type: Boolean,
    default: false
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

// Indexes for fast querying & aggregation
FeedbackSchema.index({ timestamp: -1 });
FeedbackSchema.index({ category: 1 });
FeedbackSchema.index({ sentiment: 1 });
FeedbackSchema.index({ source: 1 });
FeedbackSchema.index({ rawId: 1 });

const Feedback = mongoose.model('Feedback', FeedbackSchema);
export default Feedback;
