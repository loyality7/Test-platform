import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useQuery } from 'react-query';
import apiService from '../../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/common/Card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { 
  FileText, Users, Clock, Star,
  Calendar, Award, BookOpen, MessageSquare, Sparkles, Zap, TrendingUp, Shield
} from 'lucide-react';
import Layout from '../../layout/Layout';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { motion, AnimatePresence } from 'framer-motion';

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
                className={`text-3xl font-bold text-${config.color}-500`}
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

const Dashboard = () => {
  const auth = useAuth();
  const { isAuthenticated, token } = auth;
  const [activeTimeRange, setActiveTimeRange] = useState('1M');

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

  return (
    <Layout>
      <div className="space-y-8">
        {/* Top Metrics */}
        <div className="grid grid-cols-4 gap-6">
          {topMetrics.map((metric, index) => (
            <MetricCard key={index} {...metric} delay={index} />
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

            {/* Skill Distribution */}
            <Card>
              <CardHeader className="border-b p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold">Candidate Skill Distribution</CardTitle>
                    <p className="text-sm text-gray-500 mt-1">Overall performance across key areas</p>
                  </div>
                  <select className="text-sm border rounded-lg px-3 py-2 text-gray-600 bg-white shadow-sm focus:ring-2 focus:ring-blue-100 outline-none">
                    <option>Last 30 days</option>
                    <option>Last 90 days</option>
                    <option>Last year</option>
                  </select>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 gap-6">
                  {skillDistribution.map(skill => (
                    <ModernSkillCard key={skill.skill} {...skill} />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Side */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="border-b p-6">
                <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <motion.button 
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-2.5 px-4 rounded-lg font-medium text-white
                    bg-gradient-to-r from-blue-400 to-blue-500 
                    hover:from-blue-500 hover:to-blue-600 
                    shadow-sm hover:shadow 
                    transition-all duration-200"
                >
                  Create New Test
                </motion.button>
                <button className="w-full py-2.5 px-4 bg-white text-blue-600 border-2 border-blue-600 rounded-lg hover:bg-blue-50 font-medium">
                  Invite Candidates
                </button>
                <button className="w-full py-2.5 px-4 text-gray-700 hover:bg-gray-50 rounded-lg font-medium">
                  View Reports
                </button>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader className="border-b p-6">
                <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-start space-x-3 mb-4 last:mb-0">
                    <div className={`p-2 rounded-full ${
                      activity.type === 'test' ? 'bg-blue-100' : 'bg-green-100'
                    }`}>
                      {activity.type === 'test' ? 
                        <FileText className="h-4 w-4 text-blue-600" /> : 
                        <Users className="h-4 w-4 text-green-600" />
                      }
                    </div>
                    <div>
                      <p className="text-sm text-gray-800">{activity.message}</p>
                      <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

// Add sample recent activities data
const recentActivities = [
  {
    type: 'test',
    message: 'New JavaScript Assessment created',
    time: '5 minutes ago'
  },
  {
    type: 'candidate',
    message: 'John Doe completed Python Assessment',
    time: '10 minutes ago'
  },
  {
    type: 'test',
    message: 'React Assessment template updated',
    time: '1 hour ago'
  }
];

export default Dashboard;
