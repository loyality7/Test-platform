import mongoose from 'mongoose';

const testRegistrationSchema = new mongoose.Schema({
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
  registeredAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['registered', 'started', 'completed', 'expired'],
    default: 'registered'
  },
  testType: {
    type: String,
    enum: ['public', 'private', 'practice'],
    required: true
  },
  registrationType: {
    type: String,
    enum: ['assessment', 'practice'],
    required: true
  },
  startedAt: Date,
  completedAt: Date,
  isVendorAttempt: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate registrations
testRegistrationSchema.index({ test: 1, user: 1 }, { unique: true });

const TestRegistration = mongoose.model('TestRegistration', testRegistrationSchema);
export default TestRegistration; 