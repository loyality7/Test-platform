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
  status: {
    type: String,
    enum: ['pending', 'registered', 'completed', 'expired'],
    default: 'pending'
  },
  testType: {
    type: String,
    enum: ['practice', 'assessment'],
    required: true
  },
  registrationType: {
    type: String,
    enum: ['public', 'private'],
    required: true
  },
  registeredAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate registrations
testRegistrationSchema.index({ test: 1, user: 1 }, { unique: true });

const TestRegistration = mongoose.model('TestRegistration', testRegistrationSchema);
export default TestRegistration; 