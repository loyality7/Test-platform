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
    required: true
  },
  endTime: Date,
  duration: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'abandoned'],
    default: 'active'
  },
  deviceInfo: {
    userAgent: String,
    platform: String,
    screenResolution: String,
    language: String,
    ip: String
  }
}, {
  timestamps: true
});

export default mongoose.model('TestSession', testSessionSchema); 