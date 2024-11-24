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

    // Check if test is published (except for vendors and admins)
    const isAdmin = req.user.role === 'admin';
    const isVendor = test.vendor.toString() === req.user._id.toString();
    
    if (!isAdmin && !isVendor && test.status !== 'published') {
      return res.status(403).json({ 
        error: "Test is not currently published",
        requiresRegistration: false 
      });
    }

    // Check access control
    const isPublicTest = test.accessControl.type === 'public';
    const isPracticeTest = test.type === 'practice';
    const isAllowedUser = test.accessControl.allowedUsers?.includes(req.user._id);

    // For adding users (vendor operations), check user limit
    if (isVendor && req.method === 'POST' && 
        (req.path.includes('/users/add') || req.path.includes('/users/upload'))) {
      
      // Check if there's a user limit and if it would be exceeded
      if (test.accessControl.userLimit > 0) {
        const requestedUsers = req.body.users?.length || 1; // Default to 1 for single user additions
        const potentialTotal = test.accessControl.currentUserCount + requestedUsers;
        
        if (potentialTotal > test.accessControl.userLimit) {
          return res.status(403).json({ 
            error: "Adding these users would exceed the test's user limit",
            currentCount: test.accessControl.currentUserCount,
            limit: test.accessControl.userLimit,
            remainingSlots: test.accessControl.userLimit - test.accessControl.currentUserCount
          });
        }
      }
    }

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