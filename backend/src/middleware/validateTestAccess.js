import TestRegistration from '../models/testRegistration.model.js';
import Test from '../models/test.model.js';

export const validateTestAccess = async (req, res, next) => {
  try {
    let testId = req.params.testId || req.body.testId;
    const userId = req.user._id;
    
    // Find test by ID or UUID
    const test = await Test.findOne({
      $or: [
        { _id: testId },
        { uuid: testId }
      ]
    });

    if (!test) {
      return res.status(404).json({ 
        error: "Test not found",
        requiresRegistration: false 
      });
    }

    // Use the actual MongoDB _id for registration lookup
    testId = test._id;
    
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

    // Add test and registration to request object
    req.test = test;
    req.testRegistration = registration;
    next();
  } catch (error) {
    console.error('Test access validation error:', error);
    res.status(500).json({ 
      error: error.message,
      requiresRegistration: false 
    });
  }
}; 