import React, { useState } from 'react';
import Layout from '../../layout/Layout';
import { Card, CardHeader, CardTitle, CardContent } from '../../common/Card';
import { Plus, Save, X } from 'lucide-react';

const CreateTest = () => {
  const [testData, setTestData] = useState({
    title: '',
    category: '',
    duration: '',
    passingScore: '',
    description: '',
    instructions: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle test creation logic here
    console.log('Test Data:', testData);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-800">Create New Test</h1>
          <div className="space-x-3">
            <button className="px-4 py-2 border rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button 
              onClick={handleSubmit}
              className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Save Test
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader className="border-b p-4">
              <CardTitle>Test Details</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Test Title
                  </label>
                  <input
                    type="text"
                    value={testData.title}
                    onChange={(e) => setTestData({...testData, title: e.target.value})}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-100 outline-none"
                    placeholder="Enter test title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={testData.category}
                    onChange={(e) => setTestData({...testData, category: e.target.value})}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-100 outline-none"
                  >
                    <option value="">Select category</option>
                    <option value="programming">Programming</option>
                    <option value="web-development">Web Development</option>
                    <option value="database">Database</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    value={testData.duration}
                    onChange={(e) => setTestData({...testData, duration: e.target.value})}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-100 outline-none"
                    placeholder="Enter duration"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Passing Score (%)
                  </label>
                  <input
                    type="number"
                    value={testData.passingScore}
                    onChange={(e) => setTestData({...testData, passingScore: e.target.value})}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-100 outline-none"
                    placeholder="Enter passing score"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={testData.description}
                  onChange={(e) => setTestData({...testData, description: e.target.value})}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-100 outline-none"
                  rows="3"
                  placeholder="Enter test description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Instructions
                </label>
                <textarea
                  value={testData.instructions}
                  onChange={(e) => setTestData({...testData, instructions: e.target.value})}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-100 outline-none"
                  rows="3"
                  placeholder="Enter test instructions"
                />
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </Layout>
  );
};

export default CreateTest; 