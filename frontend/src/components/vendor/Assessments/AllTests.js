import React from 'react';
import Layout from '../../layout/Layout';
import { Card, CardHeader, CardTitle, CardContent } from '../../common/Card';
import { Search, Filter, Plus, MoreVertical } from 'lucide-react';

const AllTests = () => {
  const tests = [
    {
      id: 1,
      title: 'JavaScript Fundamentals',
      category: 'Programming',
      duration: '60 mins',
      questions: 25,
      status: 'Active',
      candidates: 45,
      lastModified: '2024-03-15'
    },
    {
      id: 2,
      title: 'React Developer Test',
      category: 'Web Development',
      duration: '90 mins',
      questions: 35,
      status: 'Draft',
      candidates: 0,
      lastModified: '2024-03-14'
    }
    // Add more test data as needed
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-800">All Tests</h1>
          <button className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create New Test
          </button>
        </div>

        {/* Search and Filter Bar */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search tests..."
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

        {/* Tests Table */}
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
                    <td className="p-4 text-sm text-gray-800 font-medium">{test.title}</td>
                    <td className="p-4 text-sm text-gray-600">{test.category}</td>
                    <td className="p-4 text-sm text-gray-600">{test.duration}</td>
                    <td className="p-4 text-sm text-gray-600">{test.questions}</td>
                    <td className="p-4 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        test.status === 'Active' ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-600'
                      }`}>
                        {test.status}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-600">{test.candidates}</td>
                    <td className="p-4 text-sm text-gray-600">{test.lastModified}</td>
                    <td className="p-4 text-sm">
                      <button className="p-1 hover:bg-gray-100 rounded">
                        <MoreVertical className="h-4 w-4 text-gray-400" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default AllTests; 