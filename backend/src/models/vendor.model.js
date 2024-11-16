import mongoose from 'mongoose';

const vendorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  approvedAt: {
    type: Date
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rejectedAt: {
    type: Date
  },
  rejectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rejectionReason: {
    type: String
  },
  company: {
    type: String,
    required: true
  },
  phone: {
    type: String
  },
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String
  },
  settings: {
    notificationPreferences: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false }
    },
    defaultTestSettings: {
      maxAttempts: { type: Number, default: 1 },
      validityDuration: { type: Number, default: 7 } // in days
    }
  },
  subscription: {
    plan: { type: String, enum: ['free', 'basic', 'premium'], default: 'free' },
    validUntil: Date
  }
  // Add other vendor fields as needed
}, {
  timestamps: true
});

// Add some useful methods
vendorSchema.methods.isSubscriptionActive = function() {
  return !this.subscription.validUntil || this.subscription.validUntil > new Date();
};

vendorSchema.methods.isApproved = function() {
  return this.status === 'approved';
};

const Vendor = mongoose.model('Vendor', vendorSchema);

export default Vendor; 