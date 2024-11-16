import Vendor from '../models/vendor.model.js';

export const checkVendorApproval = async (req, res, next) => {
  try {
    const vendor = await Vendor.findOne({ _id: req.user._id });
    
    if (!vendor) {
      return res.status(404).json({ 
        message: 'Vendor profile not found' 
      });
    }

    if (vendor.status !== 'approved') {
      return res.status(403).json({ 
        message: 'Vendor account is not approved yet. Please wait for admin approval.',
        status: vendor.status
      });
    }

    next();
  } catch (error) {
    res.status(500).json({ 
      message: 'Error checking vendor approval status',
      error: error.message 
    });
  }
}; 