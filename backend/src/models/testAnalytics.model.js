import mongoose from 'mongoose';

const testAnalyticsSchema = new mongoose.Schema({
  test: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Test',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: function() { return this.type === 'mcq'; }
  },
  challengeId: {
    type: mongoose.Schema.Types.ObjectId,
    required: function() { return this.type === 'coding'; }
  },
  type: {
    type: String,
    enum: ['mcq', 'coding', 'test'],
    required: true,
    validate: {
      validator: async function(value) {
        if (value === 'test') return true; // Always valid for general test analytics
        
        const test = await Test.findById(this.test);
        if (!test) return false;
        
        if (value === 'mcq') {
          return test.mcqs.some(mcq => mcq._id.toString() === this.questionId?.toString());
        } else {
          return test.codingChallenges.some(challenge => 
            challenge._id.toString() === this.challengeId?.toString()
          );
        }
      },
      message: 'Invalid question/challenge ID for the given type'
    }
  },
  behavior: {
    warnings: Number,
    tabSwitches: Number,
    copyPasteAttempts: Number,
    timeSpent: Number, // in seconds
    mouseMoves: Number,
    keystrokes: Number,
    browserEvents: [{
      type: String,
      timestamp: Date,
      details: mongoose.Schema.Types.Mixed
    }],
    focusLostCount: Number,
    submissionAttempts: Number,
    errorCount: Number,
    hintViews: Number
  },
  performance: {
    executionTime: Number,
    memoryUsage: Number,
    testCasesPassed: Number,
    totalTestCases: Number,
    score: Number
  },
  metadata: {
    browser: String,
    os: String,
    device: String,
    screenResolution: String,
    timestamp: Date
  }
}, {
  timestamps: true
});

// Updated index
testAnalyticsSchema.index({ 
  test: 1, 
  user: 1, 
  questionId: 1, 
  challengeId: 1, 
  type: 1 
});

export default mongoose.model('TestAnalytics', testAnalyticsSchema); 