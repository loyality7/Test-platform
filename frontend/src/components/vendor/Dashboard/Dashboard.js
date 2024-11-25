import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useQuery } from 'react-query';
import apiService from '../../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/common/Card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { 
  FileText, Users, Clock, Star,
  Calendar, Award, BookOpen, MessageSquare, Sparkles, Zap, TrendingUp, Shield, MoreVertical, UserX,
  PlusCircle, 
  UserPlus, 
  BarChart3, 
  ArrowRight,
  Settings,
  Download
} from 'lucide-react';
import Layout from '../../layout/Layout';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { motion, AnimatePresence } from 'framer-motion';
import { Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Add these helper functions at the top of your file, after the imports
const getMetricColor = (title) => {
  const colors = {
    'Total Tests': '#3b82f6',
    'Active Candidates': '#22c55e',
    'Pass Rate': '#f59e0b',
    'New Discussions': '#8b5cf6'
  };
  return colors[title] || colors['Total Tests'];
};

const getMetricBgColor = (title) => {
  const colors = {
    'Total Tests': 'bg-blue-50 ring-1 ring-blue-100',
    'Active Candidates': 'bg-green-50 ring-1 ring-green-100',
    'Pass Rate': 'bg-amber-50 ring-1 ring-amber-100',
    'New Discussions': 'bg-violet-50 ring-1 ring-violet-100'
  };
  return colors[title] || colors['Total Tests'];
};

const getMetricIconColor = (title) => {
  const colors = {
    'Total Tests': 'text-blue-500',
    'Active Candidates': 'text-green-500',
    'Pass Rate': 'text-amber-500',
    'New Discussions': 'text-violet-500'
  };
  return colors[title] || colors['Total Tests'];
};

const getMetricValueColor = (title) => {
  const colors = {
    'Total Tests': 'text-blue-600',
    'Active Candidates': 'text-green-600',
    'Pass Rate': 'text-amber-600',
    'New Discussions': 'text-violet-600'
  };
  return colors[title] || colors['Total Tests'];
};

const getMetricProgressColor = (title) => {
  const colors = {
    'Total Tests': 'bg-gradient-to-r from-blue-400 to-blue-500',
    'Active Candidates': 'bg-gradient-to-r from-green-400 to-green-500',
    'Pass Rate': 'bg-gradient-to-r from-amber-400 to-amber-500',
    'New Discussions': 'bg-gradient-to-r from-violet-400 to-violet-500'
  };
  return colors[title] || colors['Total Tests'];
};

// Add this helper function at the top of your file with other helper functions
const getStatusStyles = (status) => {
  const styles = {
    'Completed': 'bg-green-100 text-green-800 ring-1 ring-green-600/20',
    'In Progress': 'bg-blue-100 text-blue-800 ring-1 ring-blue-600/20',
    'Pending': 'bg-amber-100 text-amber-800 ring-1 ring-amber-600/20',
    'Failed': 'bg-red-100 text-red-800 ring-1 ring-red-600/20',
    'Expired': 'bg-gray-100 text-gray-800 ring-1 ring-gray-600/20'
  };
  return styles[status] || styles['Pending'];
};

// Enhanced MetricCard with hover effects and animations
const MetricCard = React.memo(({ title, value, subtitle, trend, delay }) => {
  const getMetricConfig = (title) => {
    const configs = {
      'Total Tests': {
        color: 'blue',
        bgPattern: 'radial-gradient(circle at 100% 100%, #dbeafe 0%, transparent 50%)',
        icon: FileText
      },
      'Active Candidates': {
        color: 'green',
        bgPattern: 'radial-gradient(circle at 0% 0%, #dcfce7 0%, transparent 50%)',
        icon: Users
      },
      'Pass Rate': {
        color: 'amber',
        bgPattern: 'radial-gradient(circle at 100% 0%, #fef3c7 0%, transparent 50%)',
        icon: Award
      },
      'New Discussions': {
        color: 'violet',
        bgPattern: 'radial-gradient(circle at 0% 100%, #ede9fe 0%, transparent 50%)',
        icon: MessageSquare
      }
    };
    return configs[title] || configs['Total Tests'];
  };

  const config = getMetricConfig(title);
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.1 }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
    >
      <Card className="overflow-hidden">
        <CardContent className="p-6 relative" style={{ background: config.bgPattern }}>
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <motion.div 
                whileHover={{ rotate: 15 }}
                className={`p-2.5 rounded-xl bg-${config.color}-50 ring-1 ring-${config.color}-100`}
              >
                <Icon className={`h-5 w-5 text-${config.color}-500`} />
              </motion.div>
              <span className="font-medium text-gray-800">{title}</span>
            </div>
          </div>

          {/* Value and Trend */}
          <div className="flex items-end justify-between">
            <div>
              <motion.div 
                className={`text-3xl font-bold ${
                  title === 'Total Tests' ? 'text-blue-600' :
                  title === 'Active Candidates' ? 'text-green-600' :
                  title === 'Pass Rate' ? 'text-amber-600' :
                  title === 'New Discussions' ? 'text-violet-600' :
                  'text-gray-800'
                }`}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {value}
              </motion.div>
              <span className="text-sm text-gray-500 mt-1 block">{subtitle}</span>
            </div>
            {trend && (
              <div className="flex items-center gap-1">
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`flex items-center text-sm font-medium ${
                    trend > 0 ? 'text-green-500' : 'text-red-500'
                  }`}
                >
                  <TrendingUp className={`h-4 w-4 ${trend < 0 && 'rotate-180'}`} />
                  {Math.abs(trend)}%
                </motion.div>
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className={`w-1.5 h-1.5 rounded-full ${
                    trend > 0 ? 'bg-green-400' : 'bg-red-400'
                  }`}
                />
              </div>
            )}
          </div>

          {/* Progress Indicator */}
          <div className="mt-4">
            <div className="relative h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, Number(value) / 3)}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className={`absolute h-full rounded-full bg-gradient-to-r from-${config.color}-400 to-${config.color}-500`}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
});

// Add display name for better debugging
MetricCard.displayName = 'MetricCard';

// Add TimeRangeSelector Component
const TimeRangeSelector = ({ activeRange, onRangeChange }) => {
  const ranges = [
    { label: '1H', value: '1H' },
    { label: '1D', value: '1D' },
    { label: '7D', value: '7D' },
    { label: '1M', value: '1M' },
    { label: '1Y', value: '1Y' },
  ];

  return (
    <div className="flex items-center space-x-2">
      {ranges.map(range => (
        <button
          key={range.value}
          onClick={() => onRangeChange(range.value)}
          className={`px-3 py-1 rounded-lg text-sm ${
            activeRange === range.value
              ? 'bg-blue-50 text-blue-600'
              : 'text-gray-500 hover:bg-gray-100'
          }`}
        >
          {range.label}
        </button>
      ))}
      <button className="px-3 py-1 rounded-lg text-sm text-gray-500 hover:bg-gray-100">
        Export
      </button>
    </div>
  );
};

// Add this new pill progress indicator component
const PillProgressIndicator = ({ value, isHighScore, trend }) => {
  const getStatusConfig = (score) => {
    if (score >= 90) return {
      color: 'text-green-500',
      bg: 'bg-green-500',
      glow: 'shadow-green-500/20',
      light: 'bg-green-100'
    };
    if (score >= 80) return {
      color: 'text-blue-500',
      bg: 'bg-blue-500',
      glow: 'shadow-blue-500/20',
      light: 'bg-blue-100'
    };
    return {
      color: 'text-blue-400',
      bg: 'bg-blue-400',
      glow: 'shadow-blue-400/20',
      light: 'bg-blue-50'
    };
  };

  const status = getStatusConfig(value);

  return (
    <motion.div 
      className={`relative w-44 h-16 rounded-full ${status.light} shadow-lg ${status.glow}`}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 rounded-full overflow-hidden">
        <motion.div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at 50% 50%, ${status.bg} 1px, transparent 1px)`,
            backgroundSize: '8px 8px'
          }}
          animate={{
            backgroundPosition: ['0px 0px', '8px 8px'],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </div>

      {/* Content Container */}
      <div className="relative h-full flex items-center justify-between px-4">
        {/* Score Section */}
        <div className="flex items-center gap-2">
          <motion.div 
            className={`text-2xl font-bold ${status.color}`}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
          >
            {value}
          </motion.div>
          <div className="flex flex-col">
            <span className="text-xs font-medium text-gray-500">Score</span>
            {trend && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`flex items-center gap-0.5 text-xs font-medium ${
                  trend > 0 ? 'text-green-500' : 'text-red-500'
                }`}
              >
                <TrendingUp className={`h-3 w-3 ${trend < 0 && 'rotate-180'}`} />
                {Math.abs(trend)}%
              </motion.div>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className={`h-8 w-px ${status.bg} opacity-20`} />

        {/* Status Section */}
        <div className="flex items-center gap-2">
          {isHighScore ? (
            <motion.div
              animate={{ 
                rotate: [0, 10, -10, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                repeatType: "reverse"
              }}
              className={`p-1.5 rounded-full ${status.light}`}
            >
              <Sparkles className={`h-4 w-4 ${status.color}`} />
            </motion.div>
          ) : (
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                repeatType: "reverse"
              }}
              className={`p-1.5 rounded-full ${status.light}`}
            >
              <Shield className={`h-4 w-4 ${status.color}`} />
            </motion.div>
          )}
          <span className={`text-sm font-medium ${status.color}`}>
            {value >= 90 ? 'Excellent' : value >= 80 ? 'Good' : 'Average'}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

// Update the AssessmentProgressCard to use the new PillProgressIndicator
const AssessmentProgressCard = ({ name, tests, passing, avgScore, trend, lastActivity }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ scale: 1.01 }}
      className="p-4 hover:bg-blue-50/30 rounded-xl transition-all duration-300"
    >
      <div className="flex items-center justify-between">
        {/* Left: Language & Stats */}
        <div className="flex items-center space-x-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center">
              <span className="text-lg font-semibold text-blue-600">{name.charAt(0)}</span>
            </div>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-800">{name}</h3>
            <div className="mt-1 flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-500">{tests} Tests</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-green-500" />
                <span className="text-sm text-gray-500">{passing} Passing</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: New Pill Progress Indicator */}
        <div className="flex items-center gap-6">
          <div className="text-sm text-gray-400">
            <Clock className="h-4 w-4 inline mr-2" />
            {lastActivity}
          </div>
          <PillProgressIndicator 
            value={avgScore} 
            isHighScore={avgScore >= 85}
            trend={trend}
          />
        </div>
      </div>
    </motion.div>
  );
};

// Add this new modern skill card component
const ModernSkillCard = ({ skill, score }) => {
  const getSkillConfig = (skillName, value) => {
    const configs = {
      'Problem Solving': {
        icon: Zap,
        color: value >= 85 ? 'blue' : 'indigo',
        bgPattern: 'radial-gradient(circle at 100% 100%, #dbeafe 0%, transparent 50%)'
      },
      'Code Quality': {
        icon: FileText,
        color: value >= 80 ? 'violet' : 'purple',
        bgPattern: 'radial-gradient(circle at 0% 0%, #ede9fe 0%, transparent 50%)'
      },
      'Performance': {
        icon: TrendingUp,
        color: value >= 90 ? 'green' : 'emerald',
        bgPattern: 'radial-gradient(circle at 100% 0%, #dcfce7 0%, transparent 50%)'
      },
      'Security': {
        icon: Shield,
        color: value >= 85 ? 'cyan' : 'sky',
        bgPattern: 'radial-gradient(circle at 0% 100%, #cffafe 0%, transparent 50%)'
      },
      'Best Practices': {
        icon: Award,
        color: value >= 90 ? 'amber' : 'yellow',
        bgPattern: 'radial-gradient(circle at 50% 50%, #fef3c7 0%, transparent 50%)'
      }
    };
    return configs[skillName] || configs['Problem Solving'];
  };

  const config = getSkillConfig(skill, score);
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className="relative overflow-hidden rounded-xl bg-white p-5 shadow-sm border border-gray-100"
      style={{ background: config.bgPattern }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <motion.div 
            whileHover={{ rotate: 15 }}
            className={`p-2.5 rounded-xl bg-${config.color}-50 ring-1 ring-${config.color}-100`}
          >
            <Icon className={`h-5 w-5 text-${config.color}-500`} />
          </motion.div>
          <div>
            <h3 className="font-semibold text-gray-800">{skill}</h3>
            <div className="flex items-center gap-1 mt-0.5">
              <span className={`text-xs font-medium text-${config.color}-500`}>
                {score >= 90 ? 'Expert' : score >= 80 ? 'Advanced' : 'Intermediate'}
              </span>
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className={`w-1.5 h-1.5 rounded-full bg-${config.color}-400`}
              />
            </div>
          </div>
        </div>
        
        <motion.div 
          className={`text-2xl font-bold text-${config.color}-500`}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {score}%
        </motion.div>
      </div>

      {/* Progress Bar */}
      <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={`absolute h-full rounded-full bg-gradient-to-r from-${config.color}-400 to-${config.color}-500`}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mt-4">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg bg-${config.color}-50`}>
            <Users className={`h-3.5 w-3.5 text-${config.color}-400`} />
          </div>
          <div>
            <div className="text-xs font-medium text-gray-600">Candidates</div>
            <div className="text-sm font-semibold text-gray-800">{Math.round(score * 1.5)}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg bg-${config.color}-50`}>
            <TrendingUp className={`h-3.5 w-3.5 text-${config.color}-400`} />
          </div>
          <div>
            <div className="text-xs font-medium text-gray-600">Growth</div>
            <div className="text-sm font-semibold text-gray-800">+{Math.round(score/10)}%</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Add this new component for circular progress
const CircularProgress = ({ progress, status }) => {
  const getStatusColors = (status) => {
    const colors = {
      'Completed': 'text-green-500 bg-green-50',
      'In Progress': 'text-blue-500 bg-blue-50',
      'Pending': 'text-amber-500 bg-amber-50',
      'Failed': 'text-red-500 bg-red-50',
      'Expired': 'text-gray-500 bg-gray-50'
    };
    return colors[status] || colors['Pending'];
  };

  const statusColor = getStatusColors(status);

  return (
    <div className="relative inline-flex">
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`h-12 w-12 rounded-full ${statusColor} flex items-center justify-center`}
      >
        <div className="relative">
          <CircularProgressbar
            value={progress}
            text={`${progress}%`}
            styles={buildStyles({
              rotation: 0,
              strokeLinecap: 'round',
              textSize: '24px',
              pathTransitionDuration: 0.5,
              pathColor: status === 'Completed' ? '#22c55e' :
                         status === 'In Progress' ? '#3b82f6' :
                         status === 'Pending' ? '#f59e0b' :
                         status === 'Failed' ? '#ef4444' : '#6b7280',
              textColor: status === 'Completed' ? '#22c55e' :
                        status === 'In Progress' ? '#3b82f6' :
                        status === 'Pending' ? '#f59e0b' :
                        status === 'Failed' ? '#ef4444' : '#6b7280',
              trailColor: '#f3f4f6',
            })}
          />
        </div>
      </motion.div>
    </div>
  );
};

// Add this new component for the user table
const CandidateTable = () => {
  const [selectedStatus, setSelectedStatus] = useState('All Status');
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredRow, setHoveredRow] = useState(null);

  const candidates = [
    {
      name: "Yiorgos Avraamu",
      status: "Completed",
      registeredDate: "Registered: Jan 10, 2023",
      testProgress: {
        percent: 100,
        dateRange: "Jun 11, 2023 - Jul 10, 2023",
        testType: "JavaScript Advanced",
        score: "92/100",
        timeSpent: "1h 45m"
      },
      lastLogin: {
        text: "Last login",
        time: "10s"
      }
    },
    {
      name: "Avram Tarasios",
      status: "In Progress",
      registeredDate: "Registered: Jan 15, 2023",
      testProgress: {
        percent: 45,
        dateRange: "Jun 11, 2023 - Jul 10, 2023",
        testType: "Python Data Structures",
        timeSpent: "45m",
        remainingTime: "1h 15m"
      },
      lastLogin: {
        text: "Currently active",
        time: "now"
      }
    },
    {
      name: "Quintin Ed",
      status: "Pending",
      registeredDate: "Registered: Jan 18, 2023",
      testProgress: {
        percent: 0,
        dateRange: "Jun 15, 2023 - Jul 15, 2023",
        testType: "React Advanced",
        scheduledFor: "Tomorrow, 10:00 AM"
      },
      lastLogin: {
        text: "Last login",
        time: "1h"
      }
    },
    {
      name: "Enéas Kwadwo",
      status: "In Progress",
      registeredDate: "Registered: Jan 20, 2023",
      testProgress: {
        percent: 75,
        dateRange: "Jun 18, 2023 - Jul 18, 2023",
        testType: "Java Backend",
        timeSpent: "1h 30m",
        remainingTime: "30m"
      },
      lastLogin: {
        text: "Currently active",
        time: "Online now"
      }
    }
  ];

  // Update status options (removed Failed)
  const statusOptions = ['All', 'Completed', 'In Progress', 'Pending'];

  // Filter candidates based on status and search query
  const filteredCandidates = candidates.filter(candidate => {
    const matchesStatus = selectedStatus === 'All Status' || candidate.status === selectedStatus;
    const matchesSearch = candidate.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         candidate.testProgress.testType.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Optional: Add a helper function to format the time
  const formatTime = (time) => {
    if (time === "Online now") return "now";
    return time
      .replace(" seconds ago", "s")
      .replace(" minutes ago", "m")
      .replace(" hours ago", "h")
      .replace(" days ago", "d")
      .replace(" weeks ago", "w");
  };

  return (
    <Card className="overflow-hidden">
      {/* Enhanced Header Section */}
      <div className="border-b bg-white sticky top-0 z-20">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                Active Test Takers
                <span className="px-2.5 py-0.5 text-sm bg-blue-50 text-blue-700 rounded-full">
                  {filteredCandidates.length}
                </span>
              </h3>
              <p className="text-sm text-gray-500 mt-1">Monitor candidate test status in real-time</p>
            </div>
            
            <div className="flex items-center gap-3">
              <button className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg">
                <Clock className="h-4 w-4" />
                Last 24 hours
              </button>
              <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
                <FileText className="h-4 w-4" />
                Export Report
              </button>
            </div>
          </div>

          {/* Enhanced Search and Filters */}
          <div className="flex items-center gap-4 mt-6">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search by name, test type, or status..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-100 outline-none"
              />
              <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
            
            <select 
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="min-w-[160px] text-sm border rounded-lg px-3 py-2.5 text-gray-600 bg-white shadow-sm focus:ring-2 focus:ring-blue-100 outline-none"
            >
              <option>All Status</option>
              <option>Completed</option>
              <option>In Progress</option>
              <option>Pending</option>
            </select>
          </div>

          {/* Interactive Status Pills */}
          <div className="flex items-center gap-2 mt-4">
            {statusOptions.map((status) => (
              <motion.button
                key={status}
                onClick={() => setSelectedStatus(status === 'All' ? 'All Status' : status)}
                className={`px-3 py-1.5 text-sm rounded-full transition-all ${
                  (status === 'All' ? 'All Status' : status) === selectedStatus
                    ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-200'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {status === 'In Progress' ? (
                  <span className="flex items-center gap-1">
                    {status}
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                  </span>
                ) : status}
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      <CardContent className="p-0 overflow-auto max-h-[600px]">
        <table className="w-full">
          <thead className="bg-gray-50/90 backdrop-blur-sm sticky top-0 z-10">
            <tr>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4">
                Candidate
              </th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4">
                Test Type
              </th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4">
                Progress
              </th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4">
                Status
              </th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4">
                Last Activity
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {filteredCandidates.map((candidate, index) => (
              <motion.tr 
                key={index}
                className="group hover:bg-gray-50/90 relative cursor-pointer"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onHoverStart={() => setHoveredRow(index)}
                onHoverEnd={() => setHoveredRow(null)}
              >
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <motion.div 
                      className="relative"
                      whileHover={{ scale: 1.05 }}
                    >
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 
                           flex items-center justify-center text-sm font-medium text-blue-700 
                           border border-blue-100 shadow-sm">
                        {candidate.name.charAt(0)}
                      </div>
                      <motion.div 
                        className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-white shadow-sm 
                                 flex items-center justify-center"
                        animate={{ scale: candidate.status === 'In Progress' ? [1, 1.2, 1] : 1 }}
                        transition={{ repeat: Infinity, duration: 2 }}
                      >
                        <div className={`h-2.5 w-2.5 rounded-full ${
                          candidate.status === 'In Progress' ? 'bg-green-500' : 
                          candidate.status === 'Completed' ? 'bg-blue-500' :
                          'bg-gray-300'
                        }`} />
                      </motion.div>
                    </motion.div>
                    <div>
                      <div className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                        {candidate.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {candidate.registeredDate}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-900">{candidate.testProgress.testType}</span>
                    <span className="text-xs text-gray-500">{candidate.testProgress.dateRange}</span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-4">
                    <CircularProgress 
                      progress={candidate.testProgress.percent} 
                      status={candidate.status}
                    />
                    <div className="flex flex-col">
                      {candidate.status === 'Completed' && (
                        <span className="text-sm font-medium text-gray-900">
                          {candidate.testProgress.score}
                        </span>
                      )}
                      {candidate.status === 'In Progress' && (
                        <span className="text-sm text-gray-500">
                          {candidate.testProgress.timeSpent} spent
                        </span>
                      )}
                      {candidate.status === 'Pending' && (
                        <span className="text-sm text-gray-500">
                          Not started
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className={`px-3 py-1 inline-flex text-xs font-medium rounded-full ${getStatusStyles(candidate.status)}`}>
                    {candidate.status}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <div className="flex-shrink-0">
                      <Clock className="h-4 w-4 text-gray-400" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-900">{formatTime(candidate.lastLogin.time)}</div>
                      <div className="text-xs text-gray-500">{candidate.lastLogin.text}</div>
                    </div>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>

        {/* Enhanced Empty State */}
        {filteredCandidates.length === 0 && (
          <motion.div 
            className="text-center py-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <UserX className="h-12 w-12 mx-auto text-gray-400" />
            <h3 className="mt-4 text-sm font-medium text-gray-900">No candidates found</h3>
            <p className="mt-2 text-sm text-gray-500">
              Try adjusting your search or filter to find what you're looking for.
            </p>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
};

// Update the EnhancedMetricCard component to remove the initial animation
const EnhancedMetricCard = ({ metric }) => {
  const getIcon = (title) => {
    const icons = {
      'Total Tests': FileText,
      'Active Candidates': Users,
      'Pass Rate': Award,
      'New Discussions': MessageSquare
    };
    return icons[title] || FileText;
  };

  const IconComponent = getIcon(metric.title);

  return (
    <div className="group">
      <Card className="overflow-hidden transition-all duration-200 hover:shadow-lg">
        <CardContent className="p-6 relative">
          {/* Animated Background Pattern */}
          <div 
            className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity"
            style={{ 
              background: `radial-gradient(circle at 100% 100%, ${getMetricColor(metric.title)}20 0%, transparent 50%)`,
              transform: 'scale(2)',
            }}
          />

          {/* Header with Icon */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div 
                className={`p-2.5 rounded-xl ${getMetricBgColor(metric.title)}`}
              >
                <IconComponent className={`h-5 w-5 ${getMetricIconColor(metric.title)}`} />
              </div>
              <span className="font-medium text-gray-800">{metric.title}</span>
            </div>
            
            {/* Trend Indicator */}
            {metric.trend && (
              <div
                className={`flex items-center gap-1 ${
                  metric.trend > 0 ? 'text-green-500' : 'text-red-500'
                }`}
              >
                <TrendingUp className={`h-4 w-4 ${metric.trend < 0 && 'rotate-180'}`} />
                <span className="text-sm font-medium">{Math.abs(metric.trend)}%</span>
              </div>
            )}
          </div>

          {/* Main Value */}
          <div className="mb-4">
            <div className={`text-3xl font-bold ${getMetricValueColor(metric.title)}`}>
              {metric.value}
            </div>
            <span className="text-sm text-gray-500">{metric.subtitle}</span>
          </div>

          {/* Additional Details */}
          <div className="pt-4 border-t border-gray-100">
            <div className="grid grid-cols-2 gap-4">
              {metric.details.map((detail, idx) => (
                <div key={idx} className="text-sm">
                  <div className="text-gray-500">{detail.label}</div>
                  <div className="font-semibold text-gray-900">{detail.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Progress Bar */}
          <div className="mt-4 h-1.5 bg-gray-100 rounded-full overflow-hidden"
            whileHover={{ height: '8px' }}
          >
            <div
              className={`h-full rounded-full ${getMetricProgressColor(metric.title)}`}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const Dashboard = () => {
  const auth = useAuth();
  const { isAuthenticated, token } = auth;
  const [activeTimeRange, setActiveTimeRange] = useState('1M');
  const navigate = useNavigate();

  // Assessment platform metrics
  const topMetrics = [
    {
      title: 'Total Tests',
      value: '156',
      subtitle: 'Created tests',
      trend: 12
    },
    {
      title: 'Active Candidates',
      value: '88',
      subtitle: 'Currently testing',
      trend: 8
    },
    {
      title: 'Pass Rate',
      value: '243',
      subtitle: 'Average pass rate',
      trend: 5
    },
    {
      title: 'New Discussions',
      value: '144',
      subtitle: 'Pending responses',
      trend: -3
    }
  ];

  // Assessment performance data
  const performanceData = [
    {
      name: 'JavaScript',
      tests: 156,
      passing: 120,
      avgScore: 85,
      trend: 5,
      lastActivity: '2h ago'
    },
    {
      name: 'Python',
      tests: 132,
      passing: 98,
      avgScore: 82,
      trend: -2,
      lastActivity: '4h ago'
    },
    {
      name: 'Java',
      tests: 98,
      passing: 75,
      avgScore: 79,
      trend: 3,
      lastActivity: '1d ago'
    },
    { name: 'React', completed: 88, passing: 72, avgScore: 84, trend: 2, lastActivity: '3h ago' },
    { name: 'Node.js', completed: 76, passing: 60, avgScore: 81, trend: 1, lastActivity: '5h ago' }
  ];

  // Skill distribution data
  const skillDistribution = [
    { skill: 'Problem Solving', score: 85 },
    { skill: 'Code Quality', score: 78 },
    { skill: 'Performance', score: 92 },
    { skill: 'Security', score: 88 },
    { skill: 'Best Practices', score: 95 }
  ];

  // Add these new metrics
  const extendedMetrics = [
    {
      title: 'Total Tests',
      value: '156',
      subtitle: 'Created tests',
      trend: 12,
      details: [
        { label: 'Active Tests', value: '89' },
        { label: 'Completed', value: '67' }
      ]
    },
    {
      title: 'Active Candidates',
      value: '88',
      subtitle: 'Currently testing',
      trend: 8,
      details: [
        { label: 'In Progress', value: '45' },
        { label: 'Pending', value: '43' }
      ]
    },
    {
      title: 'Pass Rate',
      value: '243',
      subtitle: 'Average pass rate',
      trend: 5,
      details: [
        { label: 'This Week', value: '85%' },
        { label: 'Last Week', value: '78%' }
      ]
    },
    {
      title: 'New Discussions',
      value: '144',
      subtitle: 'Pending responses',
      trend: -3,
      details: [
        { label: 'Unresolved', value: '89' },
        { label: 'Critical', value: '12' }
      ]
    }
  ];

  return (
    <Layout>
      <div className="space-y-8">
        {/* Enhanced Top Metrics */}
        <div className="grid grid-cols-4 gap-6">
          {extendedMetrics.map((metric, index) => (
            <EnhancedMetricCard key={index} metric={metric} />
          ))}
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Main Content - Left Side */}
          <div className="col-span-2 space-y-6">
            <Card>
              <CardHeader className="flex items-center justify-between border-b p-6">
                <CardTitle className="text-lg font-semibold">Assessment Overview</CardTitle>
                <TimeRangeSelector 
                  activeRange={activeTimeRange} 
                  onRangeChange={setActiveTimeRange}
                />
              </CardHeader>
              <CardContent className="divide-y">
                {performanceData.map((test, index) => (
                  <AssessmentProgressCard key={test.name} {...test} delay={index} />
                ))}
              </CardContent>
            </Card>

            {/* Replace UserOverviewTable with CandidateTable */}
            <CandidateTable />
          </div>

          {/* Right Side */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card className="overflow-hidden">
              <CardHeader className="border-b p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold text-gray-800">Quick Actions</CardTitle>
                    <p className="text-sm text-gray-500 mt-1">Frequently used actions</p>
                  </div>
                  <motion.button 
                    whileHover={{ rotate: 180 }}
                    transition={{ duration: 0.3 }}
                    className="p-2 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <Settings className="h-5 w-5 text-gray-400" />
                  </motion.button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Primary Action */}
                  <motion.button 
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate('/vendor/tests/create')}
                    className="w-full p-4 rounded-xl
                      bg-blue-50/50 hover:bg-blue-50
                      border border-blue-100
                      text-blue-600
                      flex items-center justify-between
                      group transition-all duration-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-lg ring-1 ring-blue-100">
                        <PlusCircle className="h-5 w-5 text-blue-500" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium">Create New Test</div>
                        <div className="text-xs text-blue-500/70">Start a new assessment</div>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-blue-400 opacity-0 group-hover:opacity-100 transform translate-x-0 
                      group-hover:translate-x-1 transition-all" />
                  </motion.button>

                  {/* Secondary Action */}
                  <motion.button 
                    whileHover={{ scale: 1.01 }}
                    className="w-full p-4 rounded-xl
                      bg-green-50/50 hover:bg-green-50
                      border border-green-100
                      text-green-600
                      flex items-center justify-between
                      group transition-all duration-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-lg ring-1 ring-green-100">
                        <UserPlus className="h-5 w-5 text-green-500" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium">Invite Candidates</div>
                        <div className="text-xs text-green-500/70">Add new test takers</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-normal text-green-500/70">Quick invite</span>
                      <ArrowRight className="h-5 w-5 text-green-400 opacity-0 group-hover:opacity-100 transform translate-x-0 
                        group-hover:translate-x-1 transition-all" />
                    </div>
                  </motion.button>

                  {/* Action Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <motion.button 
                      whileHover={{ scale: 1.01 }}
                      className="p-4 rounded-xl
                        bg-violet-50/50 hover:bg-violet-50
                        border border-violet-100
                        text-violet-600
                        flex items-center gap-3
                        group transition-all duration-200"
                    >
                      <div className="p-2 bg-white rounded-lg ring-1 ring-violet-100">
                        <BarChart3 className="h-5 w-5 text-violet-500" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium">Analytics</div>
                        <div className="text-xs text-violet-500/70">View insights</div>
                      </div>
                    </motion.button>

                    <motion.button 
                      whileHover={{ scale: 1.01 }}
                      className="p-4 rounded-xl
                        bg-amber-50/50 hover:bg-amber-50
                        border border-amber-100
                        text-amber-600
                        flex items-center gap-3
                        group transition-all duration-200"
                    >
                      <div className="p-2 bg-white rounded-lg ring-1 ring-amber-100">
                        <Download className="h-5 w-5 text-amber-500" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium">Reports</div>
                        <div className="text-xs text-amber-500/70">Download data</div>
                      </div>
                    </motion.button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Candidate Skill Distribution */}
            <Card>
              <CardHeader className="border-b p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold">Candidate Skills</CardTitle>
                    <p className="text-sm text-gray-500 mt-1">Performance by area</p>
                  </div>
                  <select className="text-sm border rounded-lg px-3 py-2 text-gray-600 bg-white shadow-sm focus:ring-2 focus:ring-blue-100 outline-none">
                    <option>Last 30 days</option>
                    <option>Last 90 days</option>
                    <option>Last year</option>
                  </select>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {skillDistribution.map(skill => (
                    <ModernSkillCard key={skill.skill} {...skill} />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
