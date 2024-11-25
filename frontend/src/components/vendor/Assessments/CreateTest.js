import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../layout/Layout';
import { Card, CardHeader, CardTitle, CardContent } from '../../common/Card';
import { Plus, Save, X, AlertCircle, FileText, Code, List } from 'lucide-react';
import { TEST_TYPES, DIFFICULTY_LEVELS, TEST_CATEGORIES } from '../../../types/test';
import { useTestManagement } from '../../../hooks/useTestManagement';
import QuestionsTab from './components/QuestionsTab';
import SettingsTab from './components/SettingsTab';

const CreateTest = () => {
  const navigate = useNavigate();
  const { loading, error, createTest, validateTestData } = useTestManagement();
  
  const [activeTab, setActiveTab] = useState('details');
  const [validationErrors, setValidationErrors] = useState({});
  
  const [testData, setTestData] = useState({
    title: '',
    category: '',
    type: '',
    difficulty: '',
    duration: '',
    passingScore: '',
    description: '',
    instructions: '',
    totalQuestions: '',
    totalMarks: '',
    skills: [],
    settings: {
      randomizeQuestions: false,
      showResults: true,
      allowReview: true,
      proctoring: false,
      timePerQuestion: false,
      negativeMarking: false
    },
    mcqs: [],
    codingChallenges: []
  });

  const calculateTotalMarks = () => {
    const mcqMarks = testData.mcqs.reduce((sum, mcq) => sum + (mcq.marks || 0), 0);
    const codingMarks = testData.codingChallenges.reduce((sum, challenge) => sum + (challenge.marks || 0), 0);
    return mcqMarks + codingMarks;
  };

  useEffect(() => {
    const total = calculateTotalMarks();
    setTestData(prev => ({
      ...prev,
      totalMarks: total
    }));
  }, [testData.mcqs, testData.codingChallenges]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const errors = validateTestData(testData);
    if (errors) {
      setValidationErrors(errors);
      return;
    }
    
    await createTest(testData);
  };

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel? All changes will be lost.')) {
      navigate('/vendor/tests');
    }
  };

  const renderError = (field) => {
    if (validationErrors[field]) {
      return (
        <span className="text-red-500 text-xs mt-1 flex items-center">
          <AlertCircle className="h-3 w-3 mr-1" />
          {validationErrors[field]}
        </span>
      );
    }
    return null;
  };

  const tabs = [
    { id: 'details', label: 'Test Details', icon: FileText },
    { id: 'questions', label: 'Questions', icon: List },
    { id: 'settings', label: 'Settings', icon: Code }
  ];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header with Actions */}
        <div className="flex justify-between items-center pb-4 border-b border-gray-200">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">Create New Test</h1>
            <p className="text-sm text-gray-500 mt-1">Create a new assessment test</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleCancel}
              className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Cancel
            </button>
            <button 
              onClick={handleSubmit}
              disabled={loading}
              className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {loading ? 'Saving...' : 'Save Test'}
            </button>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 inline-flex items-center gap-2 border-b-2 font-medium text-sm
                ${activeTab === tab.id
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="space-y-6">
          {activeTab === 'details' && (
            <Card>
              <CardHeader className="border-b p-4">
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                {/* Existing form fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Test Title*
                    </label>
                    <input
                      type="text"
                      value={testData.title}
                      onChange={(e) => setTestData({...testData, title: e.target.value})}
                      className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-100 outline-none
                        ${validationErrors.title ? 'border-red-300' : 'border-gray-300'}`}
                      placeholder="Enter test title"
                    />
                    {renderError('title')}
                  </div>
                  
                  {/* Add more enhanced fields here */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Test Type*
                    </label>
                    <select
                      value={testData.type}
                      onChange={(e) => setTestData({...testData, type: e.target.value})}
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-100 outline-none"
                    >
                      <option value="">Select type</option>
                      {Object.entries(TEST_TYPES).map(([key, value]) => (
                        <option key={key} value={value}>
                          {key.charAt(0) + key.slice(1).toLowerCase().replace('_', ' ')}
                        </option>
                      ))}
                    </select>
                    {renderError('type')}
                  </div>
                </div>

                {/* Additional fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Difficulty Level
                    </label>
                    <select
                      value={testData.difficulty}
                      onChange={(e) => setTestData({...testData, difficulty: e.target.value})}
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-100 outline-none"
                    >
                      <option value="">Select difficulty</option>
                      {Object.entries(DIFFICULTY_LEVELS).map(([key, value]) => (
                        <option key={key} value={value}>
                          {key.charAt(0) + key.slice(1).toLowerCase()}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Total Questions
                    </label>
                    <input
                      type="number"
                      value={testData.totalQuestions}
                      onChange={(e) => setTestData({...testData, totalQuestions: e.target.value})}
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-100 outline-none"
                      placeholder="Enter total questions"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Total Marks*
                    </label>
                    <input
                      type="number"
                      value={testData.totalMarks}
                      onChange={(e) => setTestData({...testData, totalMarks: parseInt(e.target.value)})}
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-100 outline-none"
                      placeholder="Enter total marks"
                      min="1"
                    />
                    {renderError('totalMarks')}
                  </div>
                </div>

                {/* Test Settings */}
                <div className="border-t pt-4 mt-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Test Settings</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(testData.settings).map(([key, value]) => (
                      <div key={key} className="flex items-center">
                        <input
                          type="checkbox"
                          id={key}
                          checked={value}
                          onChange={(e) => setTestData({
                            ...testData,
                            settings: {
                              ...testData.settings,
                              [key]: e.target.checked
                            }
                          })}
                          className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                        />
                        <label htmlFor={key} className="ml-2 block text-sm text-gray-700">
                          {key.replace(/([A-Z])/g, ' $1').charAt(0).toUpperCase() + 
                           key.replace(/([A-Z])/g, ' $1').slice(1)}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'questions' && (
            <QuestionsTab testData={testData} setTestData={setTestData} />
          )}

          {activeTab === 'settings' && (
            <SettingsTab testData={testData} setTestData={setTestData} />
          )}
        </div>
      </div>
    </Layout>
  );
};

export default CreateTest; 