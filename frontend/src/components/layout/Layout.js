import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Menu, Bell, Search, User, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const Layout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
      <div className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
        {/* Top Navigation */}
        <div className="bg-white h-16 border-b border-gray-100 flex justify-between items-center px-6 shadow-sm">
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-blue-50 rounded-lg text-blue-600"
            >
              <Menu className="h-5 w-5" />
            </motion.button>
            <h1 className="text-xl font-semibold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
              Dashboard
            </h1>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-blue-400" />
              <input
                type="text"
                placeholder="Search..."
                className="pl-10 pr-4 py-2 w-64 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-gray-50"
              />
            </div>

            <motion.div 
              className="relative"
              whileHover={{ scale: 1.05 }}
            >
              <button className="p-2 hover:bg-blue-50 rounded-lg relative group">
                <Bell className="h-5 w-5 text-blue-600 group-hover:text-blue-700" />
                <motion.span 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"
                />
              </button>
            </motion.div>

            <div className="relative">
              <motion.button 
                whileHover={{ scale: 1.02 }}
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-3 px-3 py-2 hover:bg-blue-50 rounded-lg group transition-colors"
              >
                <div className="flex flex-col items-end">
                  <span className="text-sm font-medium text-gray-700">vendor</span>
                  <span className="text-xs text-gray-400">Admin</span>
                </div>
                <div className="h-9 w-9 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center">
                  <span className="text-sm font-medium text-white">V</span>
                </div>
                <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
              </motion.button>

              <AnimatePresence>
                {isProfileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50"
                  >
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-700">vendor</p>
                      <p className="text-xs text-gray-400">vendor@example.com</p>
                    </div>
                    
                    <div className="py-2">
                      <motion.div whileHover={{ x: 4 }} className="transition-colors">
                        <Link to="/profile" className="flex items-center px-4 py-2 text-sm text-gray-600 hover:bg-blue-50 hover:text-blue-600">
                          <User className="h-4 w-4 mr-3" />
                          Profile Settings
                        </Link>
                      </motion.div>
                      <motion.div whileHover={{ x: 4 }} className="transition-colors">
                        <Link to="/settings" className="flex items-center px-4 py-2 text-sm text-gray-600 hover:bg-blue-50 hover:text-blue-600">
                          <Settings className="h-4 w-4 mr-3" />
                          Organization Settings
                        </Link>
                      </motion.div>
                    </div>
                    
                    <div className="border-t border-gray-100">
                      <motion.button 
                        whileHover={{ x: 4 }}
                        onClick={handleLogout}
                        className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <LogOut className="h-4 w-4 mr-3" />
                        Logout
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6"
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
};

export default Layout; 