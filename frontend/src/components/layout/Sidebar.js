import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, FileText, Users2, Settings, LogOut, ChevronDown, 
  Code, X, BarChart2, Calendar, Mail, BookOpen, 
  Award, Clock, Database, Activity, Layers, Target,
  PieChart, UserCheck, Briefcase, BookMarked
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Sidebar = ({ isOpen, setIsOpen, onLogout }) => {
  const [openMenus, setOpenMenus] = useState({});
  const location = useLocation();

  const menuItems = [
    {
      label: "Dashboard",
      icon: Home,
      isExpanded: true,
      children: [
        { 
          label: "Overview",  
          path: "/vendor/dashboard", 
          icon: Activity,
          badge: { text: "5", color: "success" } 
        },
        { 
          label: "Performance", 
          path: "/vendor/dashboard/performance", 
          icon: Target 
        },
        { 
          label: "Statistics", 
          path: "/vendor/dashboard/statistics", 
          icon: PieChart 
        },
        { 
          label: "Reports", 
          path: "/vendor/dashboard/reports", 
          icon: FileText 
        }
      ]
    },
    {
      label: "Assessments",
      icon: FileText,
      children: [
        { label: "All Tests", path: "/vendor/tests" },
        { label: "Create New", path: "/vendor/tests/create" },
        { label: "Templates", path: "/vendor/tests/templates" },
        { label: "Question Bank", path: "/vendor/tests/questions" },
        { label: "Archive", path: "/vendor/tests/archive" }
      ]
    },
    {
      label: "Candidates",
      icon: Users2,
      children: [
        { label: "All Candidates", path: "/vendor/candidates" },
        { label: "Active", path: "/vendor/candidates/active" },
        { label: "Completed", path: "/vendor/candidates/completed" },
        { label: "Pending", path: "/vendor/candidates/pending" }
      ]
    },
    {
      label: "Analytics",
      icon: BarChart2,
      children: [
        { label: "Test Analytics", path: "/vendor/analytics/tests" },
        { label: "Candidate Analytics", path: "/vendor/analytics/candidates" },
        { label: "Performance Insights", path: "/vendor/analytics/insights" },
        { label: "Custom Reports", path: "/vendor/analytics/reports" }
      ]
    },
    {
      label: "Schedule",
      icon: Calendar,
      children: [
        { label: "Upcoming Tests", path: "/vendor/schedule/upcoming" },
        { label: "Past Tests", path: "/vendor/schedule/past" },
        { label: "Calendar View", path: "/vendor/schedule/calendar" }
      ]
    },
    {
      label: "Resources",
      icon: Database,
      children: [
        { label: "Documentation", path: "/vendor/resources/docs" },
        { label: "API Access", path: "/vendor/resources/api" },
        { label: "Guides", path: "/vendor/resources/guides" },
        { label: "Support", path: "/vendor/resources/support" }
      ]
    }
  ];

  // Auto-open menu based on current path
  useEffect(() => {
    const currentPath = location.pathname;
    menuItems.forEach(item => {
      if (item.children?.some(child => currentPath.startsWith(child.path))) {
        setOpenMenus(prev => ({ ...prev, [item.label]: true }));
      }
    });
  }, [location.pathname]);

  const toggleMenu = (menu) => {
    setOpenMenus(prev => ({...prev, [menu]: !prev[menu]}));
  };

  const MenuItem = ({ item }) => {
    const Icon = item.icon;
    const isOpen = openMenus[item.label];
    const hasChildren = item.children?.length > 0;
    const isActive = location.pathname === item.path;
    
    return (
      <div className="group">
        <motion.button
          onClick={() => toggleMenu(item.label)}
          className={`w-full flex items-center px-3 py-2 text-sm
            ${isOpen ? 'bg-emerald-50' : ''}
            ${isActive ? 'bg-emerald-50' : 'hover:bg-gray-50'}
            text-gray-700 rounded-md group transition-colors duration-150`}
        >
          <div className={`p-1.5 rounded-md mr-2.5 ${
            isOpen || isActive ? 'bg-emerald-100' : 'group-hover:bg-gray-100'
          }`}>
            <Icon className={`h-4 w-4 ${
              isOpen || isActive ? 'text-emerald-600' : 'text-gray-500'
            }`} />
          </div>
          <span className={`font-medium ${isOpen || isActive ? 'text-emerald-600' : ''}`}>
            {item.label}
          </span>
          {hasChildren && (
            <ChevronDown className={`h-3.5 w-3.5 ml-auto transition-transform duration-200
              ${isOpen ? 'rotate-180' : ''} 
              ${isOpen ? 'text-emerald-500' : 'text-gray-400'}`} 
            />
          )}
        </motion.button>
        
        <AnimatePresence>
          {hasChildren && isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-1 space-y-1"
            >
              {item.children.map((child, index) => (
                <Link
                  key={index}
                  to={child.path}
                  className={`flex items-center pl-8 pr-3 py-2 text-sm rounded-md
                    ${location.pathname === child.path 
                      ? 'bg-emerald-50 text-emerald-600' 
                      : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  {child.icon && (
                    <child.icon className={`h-3.5 w-3.5 mr-2.5 ${
                      location.pathname === child.path 
                        ? 'text-emerald-500' 
                        : 'text-gray-400'
                    }`} />
                  )}
                  <span>{child.label}</span>
                  {child.badge && (
                    <span className="ml-auto px-1.5 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-600 rounded-full">
                      {child.badge.text}
                    </span>
                  )}
                </Link>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <motion.div 
      initial={false}
      animate={{ x: isOpen ? 0 : -256 }}
      className="fixed inset-y-0 left-0 bg-white border-r border-gray-100 w-64 z-30"
    >
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="px-4 py-4 flex items-center border-b border-gray-100">
          <div className="p-1.5 bg-emerald-100 rounded-lg mr-3">
            <Code className="h-5 w-5 text-emerald-600" />
          </div>
          <span className="font-semibold text-gray-800">
            Assessment Pro
          </span>
        </div>
        
        {/* Menu Items with thinner scrollbar */}
        <div className="flex-1 py-4 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
          <div className="space-y-1 px-3">
            {menuItems.map((item, index) => (
              <MenuItem key={index} item={item} />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-100">
          <Link 
            to="/vendor/settings"
            className="flex items-center px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md group"
          >
            <div className="p-1.5 rounded-md mr-2.5 group-hover:bg-gray-100">
              <Settings className="h-4 w-4 text-gray-400" />
            </div>
            <span className="font-medium">Settings</span>
          </Link>
          <button 
            onClick={onLogout}
            className="w-full flex items-center px-3 py-2 mt-1 text-sm text-red-500 hover:bg-gray-50 rounded-md group"
          >
            <div className="p-1.5 rounded-md mr-2.5 group-hover:bg-red-50">
              <LogOut className="h-4 w-4" />
            </div>
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default Sidebar; 