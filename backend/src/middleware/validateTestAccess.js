import TestRegistration from '../models/testRegistration.model.js';
import User from '../models/user.model.js';

export const validateTestAccess = async (req, res, next) => {
  try {
    const testId = req.params.testId || req.body.testId;
    const userId = req.user._id;

    // Check if user has completed profile
    const user = await User.findById(userId);
    const requiredFields = ['name', 'email', 'phone', 'education', 'experience'];
    const missingFields = requiredFields.filter(field => {
      if (field === 'education' || field === 'experience') {
        return !user[field] || user[field].length === 0;
      }
      return !user[field];
    });

    if (missingFields.length > 0) {
      return res.status(403).json({
        error: "Profile incomplete",
        missingFields,
        requiresProfile: true
      });
    }

    // Check if user is registered for the test
    const registration = await TestRegistration.findOne({
      test: testId,
      user: userId,
      status: { $in: ['registered', 'started'] }
    });

    if (!registration) {
      return res.status(403).json({
        error: "Not registered for test",
        requiresRegistration: true
      });
    }

    // If test is registered but not started, update status to started
    if (registration.status === 'registered') {
      registration.status = 'started';
      registration.startedAt = new Date();
      await registration.save();
    }

    // Add registration to request object for potential future use
    req.testRegistration = registration;
    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}; 