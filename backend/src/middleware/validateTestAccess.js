import Test from '../models/test.model.js';

export const validateTestAccess = async (req, res, next) => {
  try {
    // Extract required parameters from request
    let testId = req.params.testId || req.body.testId;
    const userId = req.user._id;

    // Find test by either MongoDB ID or UUID
    const test = await Test.findOne({
      $or: [
        { _id: testId },
        { uuid: testId }
      ]
    });

    // Return 404 if test doesn't exist
    if (!test) {
      return res.status(404).json({ 
        error: "Test not found",
        requiresRegistration: false 
      });
    }

    // Check access control
    const isAdmin = req.user.role === 'admin';
    const isVendor = test.vendor.toString() === req.user._id.toString();
    const isPublicTest = test.accessControl.type === 'public';
    const isPracticeTest = test.type === 'practice';
    const isAllowedUser = test.accessControl.allowedUsers?.includes(req.user._id);

    // Only allow registration for public/practice tests
    // For private/assessment tests, user must be explicitly allowed
    if (!isAdmin && !isVendor && !isPublicTest && !isPracticeTest && !isAllowedUser) {
      return res.status(403).json({ 
        error: "Not authorized to access this test",
        requiresRegistration: false 
      });
    }

    // Ensure we use MongoDB _id for subsequent queries
    testId = test._id;
    
    // Store validated objects in request for use in subsequent middleware/routes
    req.test = test;
    next();
  } catch (error) {
    // Log and return any unexpected errors
    console.error('Test access validation error:', error);
    res.status(500).json({ 
      error: error.message,
      requiresRegistration: false 
    });
  }
}; 