import TestRegistration from '../models/testRegistration.model.js';

export const validateTestAccess = async (req, res, next) => {
  try {
    const testId = req.params.testId || req.body.testId;
    const userId = req.user._id;
    
    // Check if user isregistered for the test
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