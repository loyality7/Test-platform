import React, { useState } from 'react';
import Layout from '../../layout/Layout';
import { Card, CardHeader, CardTitle, CardContent } from '../../common/Card';
import { Search, Filter, Plus, Tag, MoreVertical, Edit2, Trash2 } from 'lucide-react';

const QuestionBank = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const questions = [
    {
      id: 1,
      question: 'What is the difference between let and const in JavaScript?',
      type: 'Multiple Choice',
      category: 'JavaScript',
      difficulty: 'Intermediate',
      lastModified: '2024-03-15',
      usageCount: 45
    },
    {
      id: 2,
      question: 'Explain the concept of Python decorators with an example.',
      type: 'Programming',
      category: 'Python',
      difficulty: 'Advanced',
      lastModified: '2024-03-14',
      usageCount: 32
    }
  ];

  const categories = [
    { id: 'all', name: 'All Questions' },
    { id: 'javascript', name: 'JavaScript' },
    { id: 'python', name: 'Python' },
    { id: 'java', name: 'Java' },
    { id: 'sql', name: 'SQL' }
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-800">Question Bank</h1>
          <button className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Question
          </button>
        </div>

        <div className="grid grid-cols-4 gap-6">
          {/* Categories Sidebar */}
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <h3 className="font-medium text-gray-800 mb-3">Categories</h3>
                <div className="space-y-2">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                        selectedCategory === category.id
                          ? 'bg-emerald-50 text-emerald-600'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Questions List */}
          <div className="col-span-3 space-y-4">
            {/* Search and Filter */}
            <Card>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <div className="flex-1 relative">
                    <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search questions..."
                      className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-100 outline-none"
                    />
                  </div>
                  <button className="px-4 py-2 border rounded-lg flex items-center gap-2 hover:bg-gray-50">
                    <Filter className="h-4 w-4" />
                    Filters
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Questions */}
            <div className="space-y-4">
              {questions.map((question) => (
                <Card key={question.id}>
                  <CardContent className="p-4">
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <h3 className="font-medium text-gray-800">{question.question}</h3>
                        <div className="flex items-center gap-2">
                          <button className="p-1 hover:bg-gray-50 rounded">
                            <Edit2 className="h-4 w-4 text-gray-400" />
                          </button>
                          <button className="p-1 hover:bg-gray-50 rounded">
                            <Trash2 className="h-4 w-4 text-gray-400" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm">
                        <span className="px-2 py-1 bg-gray-50 rounded-full text-gray-600">
                          {question.type}
                        </span>
                        <span className="px-2 py-1 bg-blue-50 rounded-full text-blue-600">
                          {question.category}
                        </span>
                        <span className="px-2 py-1 bg-amber-50 rounded-full text-amber-600">
                          {question.difficulty}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>Last modified: {question.lastModified}</span>
                        <span>Used in {question.usageCount} tests</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default QuestionBank; 