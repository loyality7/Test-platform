import User from '../models/user.model.js';

export const validateProfile = async (req, res, next) => {
  try {
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

    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}; 