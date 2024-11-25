//pure react
import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-white shadow-md mt-auto">
      <div className="container mx-auto px-6 py-8">
        {/* Main Footer Content */}
        <div className="text-center">
          <Link to="/" className="flex items-center justify-center space-x-2 mb-4">
            <img 
              src="https://res.cloudinary.com/dfdtxogcl/images/c_scale,w_248,h_180,dpr_1.25/f_auto,q_auto/v1706606519/Picture1_215dc6b/Picture1_215dc6b.png"
              alt="Test Platform Logo"
              className="w-8 h-8 object-contain"
            />
            <span className="text-xl font-bold">Test Platform</span>
          </Link>
          <p className="text-gray-600 text-sm">
            Empowering learners through comprehensive online testing and practice solutions.
          </p>
        </div>

        {/* Commented out sections for future reference */}
        {/* Quick Links Section
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          ... Quick Links content ...
        </div> */}

        {/* Resources Section
        <div className="text-center md:text-left">
          ... Resources content ...
        </div> */}

        {/* Connect Section
        <div className="text-center md:text-left">
          ... Social media links ...
        </div> */}

        {/* Bottom Bar */}
        <div className="border-t border-gray-200 pt-6">
          <div className="text-center text-sm text-gray-600">
            <p>&copy; {new Date().getFullYear()} Test Platform. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

