import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const auth = async (req, res, next) => {
  try {
    console.log('Auth middleware - Headers:', req.headers); // Debug log

    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      console.log('No token provided'); // Debug log
      return res.status(401).json({ error: 'No authentication token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded token:', decoded); // Debug log

    const user = await User.findById(decoded.id);
    if (!user) {
      console.log('User not found'); // Debug log
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user;
    console.log('User attached to request:', user._id); // Debug log
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Not authorized to access this resource" });
    }
    
    next();
  };
};
