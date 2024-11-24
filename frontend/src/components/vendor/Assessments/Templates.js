import React from 'react';
import Layout from '../../layout/Layout';
import { Card, CardHeader, CardTitle, CardContent } from '../../common/Card';
import { Search, Filter, Copy, Star, Clock, FileText } from 'lucide-react';

const Templates = () => {
  const templates = [
    {
      id: 1,
      title: 'Full Stack Developer Assessment',
      category: 'Web Development',
      duration: '120 mins',
      questions: 40,
      difficulty: 'Advanced',
      popularity: 4.8,
      usageCount: 234
    },
    {
      id: 2,
      title: 'Python Programming Basics',
      category: 'Programming',
      duration: '60 mins',
      questions: 25,
      difficulty: 'Beginner',
      popularity: 4.5,
      usageCount: 567
    },
    {
      id: 3,
      title: 'SQL Database Expert',
      category: 'Database',
      duration: '90 mins',
      questions: 30,
      difficulty: 'Intermediate',
      popularity: 4.6,
      usageCount: 345
    }
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-800">Test Templates</h1>
          <div className="flex gap-3">
            <button className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filter
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search templates..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-100 outline-none"
              />
            </div>
          </CardContent>
        </Card>

        {/* Templates Grid */}
        <div className="grid grid-cols-3 gap-6">
          {templates.map((template) => (
            <Card key={template.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-gray-800">{template.title}</h3>
                    <button className="p-1 hover:bg-gray-50 rounded-full">
                      <Copy className="h-4 w-4 text-gray-400" />
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <FileText className="h-4 w-4" />
                    <span>{template.category}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span>{template.duration}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{template.questions}</span>
                      <span className="text-gray-500">Questions</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-amber-400 fill-current" />
                      <span className="font-medium">{template.popularity}</span>
                    </div>
                    <span className="text-sm text-gray-500">
                      Used {template.usageCount} times
                    </span>
                  </div>

                  <button className="w-full px-4 py-2 mt-2 text-emerald-500 border border-emerald-500 rounded-lg hover:bg-emerald-50">
                    Use Template
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Templates; 