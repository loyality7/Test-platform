import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Popover } from '@headlessui/react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { Tooltip } from 'react-tooltip';
import Layout from '../../layout/Layout';
import { Card, CardHeader, CardTitle, CardContent } from '../../common/Card';
import { 
  Search, Filter, Plus, MoreVertical, Clock, Users, Calendar, Download,
  Edit, Trash2, Eye, TrendingUp, Award, Brain, Target, Share2, Copy,
  BarChart2, Settings, AlertTriangle, CheckCircle, X
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';

const AllTests = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('grid');
  const [selectedTest, setSelectedTest] = useState(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Add these new statistics
  const analyticsData = {
    completionTrend: [
      { month: 'Jan', rate: 65 },
      { month: 'Feb', rate: 75 },
      { month: 'Mar', rate: 85 },
    ],
    performanceMetrics: {
      avgScore: 78,
      passRate: 82,
      avgCompletionTime: '45 mins',
      totalAttempts: 1234
    },
    skillGaps: [
      { skill: 'React', gap: 25 },
      { skill: 'Node.js', gap: 15 },
      { skill: 'Python', gap: 30 }
    ]
  };

  // Enhanced stats with trends
  const enhancedStats = [
    {
      title: 'Total Tests',
      value: '24',
      trend: '+12%',
      icon: Brain,
      color: 'blue',
      subtext: '5 tests added this month'
    },
    {
      title: 'Active Tests',
      value: '12',
      trend: '+8%',
      icon: CheckCircle,
      color: 'green',
      subtext: '3 tests scheduled today'
    },
    {
      title: 'Avg. Completion',
      value: '78%',
      trend: '+15%',
      icon: Target,
      color: 'purple',
      subtext: 'Above industry average'
    },
    {
      title: 'Total Candidates',
      value: '1,234',
      trend: '+25%',
      icon: Users,
      color: 'orange',
      subtext: '89 active now'
    }
  ];

  // Add this new component for the analytics modal
  const AnalyticsModal = ({ test, onClose }) => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
    >
      <div className="bg-white rounded-xl w-11/12 max-w-4xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Test Analytics: {test.title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {Object.entries(analyticsData.performanceMetrics).map(([key, value], index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm text-gray-500 capitalize">{key.replace(/([A-Z])/g, ' $1')}</h3>
              <p className="text-2xl font-bold mt-2">{value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Completion Trend</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={analyticsData.completionTrend}>
                <XAxis dataKey="month" />
                <YAxis />
                <Bar dataKey="rate" fill="#4F46E5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Skill Gap Analysis</h3>
            <div className="space-y-4">
              {analyticsData.skillGaps.map((skill, index) => (
                <div key={index} className="relative">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">{skill.skill}</span>
                    <span className="text-sm text-gray-500">{skill.gap}% gap</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-indigo-600 h-2 rounded-full"
                      style={{ width: `${100 - skill.gap}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );

  // Add these new action handlers
  const useTestActions = () => {
    const handlePreview = useCallback((testId) => {
      navigate(`/vendor/tests/${testId}/preview`);
    }, [navigate]);

    const handleEdit = useCallback((testId) => {
      navigate(`/vendor/tests/${testId}/edit`);
    }, [navigate]);

    const handleShare = useCallback((test) => {
      const shareLink = `${window.location.origin}/test/${test.id}`;
      navigator.clipboard.writeText(shareLink);
      toast.success('Test link copied to clipboard!');
    }, []);

    const handleDuplicate = useCallback(async (test) => {
      try {
        toast.success('Test duplicated successfully!');
      } catch (error) {
        toast.error('Failed to duplicate test');
      }
    }, []);

    const handleDelete = useCallback(async (testId) => {
      if (window.confirm('Are you sure you want to delete this test?')) {
        try {
          toast.success('Test deleted successfully!');
        } catch (error) {
          toast.error('Failed to delete test');
        }
      }
    }, []);

    return {
      handlePreview,
      handleEdit,
      handleShare,
      handleDuplicate,
      handleDelete
    };
  };

  // Updated TestCard component
  const TestCard = React.memo(({ test }) => {
    const actions = useTestActions();
    const [showStats, setShowStats] = useState(false);

    // Calculate test metrics
    const passRate = test.passRate || 75;
    const avgScore = test.avgScore || 82;
    const completionTime = test.avgCompletionTime || '45 mins';

    return (
      <div className="relative">
        <Card className="hover:shadow-xl transition-all duration-200">
          <CardContent className="p-6">
            {/* Status Badge and Score */}
            <div className="absolute top-4 right-4 flex flex-col items-end gap-3">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                test.status === 'Active' 
                  ? 'bg-green-50 text-green-600' 
                  : test.status === 'Draft'
                  ? 'bg-yellow-50 text-yellow-600'
                  : 'bg-gray-50 text-gray-600'
              }`}>
                {test.status}
              </span>
              <div className="w-16 h-16" data-tooltip-id={`completion-tooltip-${test.id}`}>
                <CircularProgressbar
                  value={parseInt(test.completionRate)}
                  text={`${test.completionRate}`}
                  styles={buildStyles({
                    pathColor: parseInt(test.completionRate) > 75 ? '#10b981' : '#f59e0b',
                    textSize: '24px',
                    textColor: '#374151',
                    trailColor: '#e5e7eb',
                  })}
                />
              </div>
              <Tooltip id={`completion-tooltip-${test.id}`}>
                Completion Rate: {test.completionRate}
              </Tooltip>
            </div>

            {/* Test Info */}
            <div>
              <h3 className="font-semibold text-lg text-gray-900 pr-20">{test.title}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-gray-500">{test.category}</span>
                <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                <span className={`text-sm font-medium ${
                  test.difficulty === 'Advanced' ? 'text-red-500' :
                  test.difficulty === 'Intermediate' ? 'text-yellow-500' :
                  'text-green-500'
                }`}>
                  {test.difficulty}
                </span>
              </div>
            </div>

            {/* Skills Tags */}
            <div className="mt-4 flex flex-wrap gap-2">
              {test.skills.map((skill, index) => (
                <span 
                  key={index}
                  className="px-2 py-1 bg-gray-50 text-gray-600 rounded-md text-xs font-medium"
                >
                  {skill}
                </span>
              ))}
            </div>

            {/* Quick Stats Toggle */}
            <button 
              onClick={() => setShowStats(!showStats)}
              className="mt-4 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              {showStats ? 'Hide Stats' : 'Show Stats'}
            </button>

            {/* Enhanced Stats Section */}
            {showStats && (
              <div className="mt-4 grid grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-indigo-600">{passRate}%</div>
                  <div className="text-xs text-gray-500">Pass Rate</div>
                </div>
                <div className="text-center border-x border-gray-200">
                  <div className="text-2xl font-bold text-indigo-600">{avgScore}</div>
                  <div className="text-xs text-gray-500">Avg Score</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-indigo-600">{completionTime}</div>
                  <div className="text-xs text-gray-500">Avg Time</div>
                </div>
              </div>
            )}

            {/* Test Details */}
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="flex items-center text-sm text-gray-600">
                <Clock className="h-4 w-4 mr-2 text-gray-400" />
                {test.duration}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Brain className="h-4 w-4 mr-2 text-gray-400" />
                {test.questions} Questions
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Users className="h-4 w-4 mr-2 text-gray-400" />
                {test.candidates} Candidates
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                {new Date(test.lastModified).toLocaleDateString()}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 pt-4 border-t flex justify-between items-center">
              <div className="flex gap-2">
                <button 
                  onClick={() => actions.handlePreview(test.id)}
                  className="p-2 hover:bg-gray-50 rounded-lg transition-colors duration-200 group" 
                  title="Preview Test"
                >
                  <Eye className="h-4 w-4 text-gray-600 group-hover:text-indigo-600" />
                </button>
                <button 
                  onClick={() => actions.handleEdit(test.id)}
                  className="p-2 hover:bg-gray-50 rounded-lg transition-colors duration-200 group" 
                  title="Edit Test"
                >
                  <Edit className="h-4 w-4 text-gray-600 group-hover:text-indigo-600" />
                </button>
                <button 
                  onClick={() => actions.handleShare(test)}
                  className="p-2 hover:bg-gray-50 rounded-lg transition-colors duration-200 group" 
                  title="Share Test"
                >
                  <Share2 className="h-4 w-4 text-gray-600 group-hover:text-indigo-600" />
                </button>
                <button 
                  onClick={() => actions.handleDuplicate(test)}
                  className="p-2 hover:bg-gray-50 rounded-lg transition-colors duration-200 group" 
                  title="Duplicate Test"
                >
                  <Copy className="h-4 w-4 text-gray-600 group-hover:text-indigo-600" />
                </button>
              </div>
              
              <Popover className="relative">
                <Popover.Button className="p-2 hover:bg-gray-50 rounded-lg transition-colors duration-200">
                  <MoreVertical className="h-4 w-4 text-gray-600" />
                </Popover.Button>

                <Popover.Panel className="absolute right-0 z-10 mt-2 w-48 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5">
                  <div className="py-1">
                    <button
                      onClick={() => actions.handleDelete(test.id)}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Test
                    </button>
                    <button
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <BarChart2 className="h-4 w-4 mr-2" />
                      View Analytics
                    </button>
                    <button
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export Results
                    </button>
                  </div>
                </Popover.Panel>
              </Popover>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  });

  const stats = [
    { title: 'Total Tests', value: '24', icon: Brain, color: 'blue' },
    { title: 'Active Tests', value: '12', icon: CheckCircle, color: 'green' },
    { title: 'Avg. Completion Rate', value: '78%', icon: Target, color: 'purple' },
    { title: 'Total Candidates', value: '1,234', icon: Users, color: 'orange' },
  ];

  const quickFilters = [
    { label: 'Recent Tests', count: 5 },
    { label: 'High Performance', count: 8 },
    { label: 'Needs Review', count: 3 },
    { label: 'Expiring Soon', count: 2 },
  ];

  const tests = [
    {
      id: '1',
      title: 'Full Stack Developer Assessment',
      category: 'Web Development',
      status: 'Active',
      duration: '120 mins',
      questions: 25,
      candidates: 48,
      lastModified: '2024-03-15',
      difficulty: 'Advanced',
      skills: ['React', 'Node.js', 'MongoDB'],
      completionRate: '85%'
    },
    {
      id: '2',
      title: 'Python Data Structures',
      category: 'Programming',
      status: 'Active',
      duration: '60 mins',
      questions: 20,
      candidates: 156,
      lastModified: '2024-03-14',
      difficulty: 'Intermediate',
      skills: ['Python', 'DSA'],
      completionRate: '92%'
    },
    {
      id: '3',
      title: 'System Design Interview',
      category: 'System Design',
      status: 'Draft',
      duration: '90 mins',
      questions: 15,
      candidates: 0,
      lastModified: '2024-03-13',
      difficulty: 'Advanced',
      skills: ['Architecture', 'Scalability'],
      completionRate: '0%'
    },
    {
      id: '4',
      title: 'Frontend Development',
      category: 'Web Development',
      status: 'Active',
      duration: '75 mins',
      questions: 30,
      candidates: 89,
      lastModified: '2024-03-12',
      difficulty: 'Intermediate',
      skills: ['React', 'JavaScript', 'CSS'],
      completionRate: '78%'
    },
    {
      id: '5',
      title: 'DevOps Fundamentals',
      category: 'DevOps',
      status: 'Active',
      duration: '90 mins',
      questions: 40,
      candidates: 67,
      lastModified: '2024-03-11',
      difficulty: 'Advanced',
      skills: ['Docker', 'Kubernetes', 'CI/CD'],
      completionRate: '71%'
    },
    {
      id: '6',
      title: 'SQL Database Design',
      category: 'Database',
      status: 'Draft',
      duration: '45 mins',
      questions: 25,
      candidates: 0,
      lastModified: '2024-03-10',
      difficulty: 'Intermediate',
      skills: ['SQL', 'Database Design'],
      completionRate: '0%'
    }
  ];

  // Add this function to handle navigation
  const handleCreateTest = () => {
    navigate('/vendor/tests/create');
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Enhanced Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {stats.map((stat, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow duration-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">{stat.title}</p>
                    <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
                    <div className="mt-2 flex items-center text-xs">
                      <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                      <span className="text-green-500">12% increase</span>
                    </div>
                  </div>
                  <div className={`p-4 bg-${stat.color}-50 rounded-full`}>
                    <stat.icon className={`h-6 w-6 text-${stat.color}-500`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Header with Quick Filters */}
        <div className="flex flex-col space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-semibold text-gray-800">Assessment Tests</h1>
              <p className="text-sm text-gray-500 mt-1">Create, manage and analyze your tests</p>
            </div>
            <div className="flex gap-3">
              <button className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export Data
              </button>
              <button 
                onClick={handleCreateTest}
                className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Create Test
              </button>
            </div>
          </div>
          
          {/* Quick Filters */}
          <div className="flex gap-4 overflow-x-auto pb-2">
            {quickFilters.map((filter, index) => (
              <button
                key={index}
                className="px-4 py-2 bg-white border rounded-full hover:bg-gray-50 flex items-center gap-2 whitespace-nowrap"
              >
                {filter.label}
                <span className="px-2 py-0.5 bg-gray-100 rounded-full text-xs">
                  {filter.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Advanced Search and Filters */}
        <Card className="border-none shadow-lg">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search tests by name, category, skills..."
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-100 outline-none"
                />
              </div>
              <div className="flex flex-wrap gap-3">
                <select className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-100 outline-none">
                  <option>All Categories</option>
                  <option>Programming</option>
                  <option>Web Development</option>
                  <option>System Design</option>
                  <option>DevOps</option>
                </select>
                <select className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-100 outline-none">
                  <option>Difficulty</option>
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                </select>
                <select className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-100 outline-none">
                  <option>Duration</option>
                  <option>&lt; 30 mins</option>
                  <option>30-60 mins</option>
                  <option>&gt; 60 mins</option>
                </select>
                <button className="px-4 py-2 border rounded-lg flex items-center gap-2 hover:bg-gray-50">
                  <Filter className="h-4 w-4" />
                  More Filters
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* View Toggle */}
        <div className="flex justify-end gap-2 mb-4">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded ${viewMode === 'grid' ? 'bg-gray-100' : ''}`}
          >
            <BarChart2 className="h-5 w-5" />
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`p-2 rounded ${viewMode === 'table' ? 'bg-gray-100' : ''}`}
          >
            <Settings className="h-5 w-5" />
          </button>
        </div>

        {/* Test Cards Grid View */}
        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tests.map((test) => (
              <TestCard key={test.id} test={test} />
            ))}
          </div>
        )}

        {/* Existing Table View */}
        {viewMode === 'table' && (
          <Card>
            <CardContent className="p-0">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left p-4 text-sm font-medium text-gray-600">Test Name</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-600">Category</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-600">Duration</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-600">Questions</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-600">Status</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-600">Candidates</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-600">Last Modified</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {tests.map((test) => (
                    <tr key={test.id} className="hover:bg-gray-50">
                      <td className="p-4">
                        <div>
                          <div className="text-sm font-medium text-gray-800">{test.title}</div>
                          <div className="text-xs text-gray-500">ID: #{test.id}</div>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-gray-600">{test.category}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">{test.duration}</span>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-gray-600">{test.questions}</td>
                      <td className="p-4 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          test.status === 'Active' 
                            ? 'bg-green-50 text-green-600' 
                            : 'bg-gray-50 text-gray-600'
                        }`}>
                          {test.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">{test.candidates}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">{test.lastModified}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <button className="p-1 hover:bg-gray-100 rounded" title="View">
                            <Eye className="h-4 w-4 text-gray-400" />
                          </button>
                          <button className="p-1 hover:bg-gray-100 rounded" title="Edit">
                            <Edit className="h-4 w-4 text-gray-400" />
                          </button>
                          <button className="p-1 hover:bg-gray-100 rounded" title="Delete">
                            <Trash2 className="h-4 w-4 text-gray-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default AllTests; 