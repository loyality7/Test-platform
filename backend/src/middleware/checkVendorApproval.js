import Vendor from '../models/vendor.model.js';

export const checkVendorApproval = async (req, res, next) => {
  try {
    console.log('Checking vendor approval for user:', req.user._id);
    
    const vendor = await Vendor.findOne({ _id: req.user._id });
    
    if (!vendor) {
      console.log('No vendor profile found');
      return res.status(404).json({ 
        message: 'Vendor profile not found' 
      });
    }

    console.log('Vendor status:', vendor.status);

    if (vendor.status !== 'approved') {
      return res.status(403).json({ 
        message: 'Vendor account is not approved yet. Please wait for admin approval.',
        status: vendor.status
      });
    }

    req.vendor = vendor;
    next();
  } catch (error) {
    console.error('Error in checkVendorApproval:', error);
    res.status(500).json({ 
      message: 'Error checking vendor approval status',
      error: error.message 
    });
  }
}; 