import mongoose from 'mongoose';

const testSessionSchema = new mongoose.Schema({
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
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: Date,
  status: {
    type: String,
    enum: ['started', 'in_progress', 'completed', 'terminated'],
    default: 'started'
  },
  browserSwitches: {
    type: Number,
    default: 0
  },
  tabSwitches: {
    type: Number,
    default: 0
  },
  proctorNotes: [{
    note: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  ipAddress: String,
  userAgent: String,
  currentQuestion: {
    type: Number,
    default: 0
  },
  answers: [{
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    answerData: mongoose.Schema.Types.Mixed,
    timeSpent: {
      type: Number,
      default: 0
    }
  }],
  isVendorAttempt: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const TestSession = mongoose.model('TestSession', testSessionSchema);

export default TestSession; 