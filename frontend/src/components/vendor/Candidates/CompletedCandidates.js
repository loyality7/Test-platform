import React from 'react';
import Layout from '../../layout/Layout';
import { Card, CardHeader, CardTitle, CardContent } from '../../common/Card';
import { Search, Filter, Download, CheckCircle } from 'lucide-react';

const CompletedCandidates = () => {
  const completedCandidates = [
    {
      id: 1,
      name: 'John Smith',
      email: 'john@example.com',
      testName: 'Python Development',
      completionDate: '2024-03-14',
      score: 92,
      timeTaken: '55 mins',
      result: 'Passed'
    },
    {
      id: 2,
      name: 'Emma Davis',
      email: 'emma@example.com',
      testName: 'Database Design',
      completionDate: '2024-03-13',
      score: 78,
      timeTaken: '48 mins',
      result: 'Passed'
    }
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-800">Completed Tests</h1>
          <div className="flex gap-3">
            <button className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export Results
            </button>
          </div>
        </div>

        {/* Search and Filter */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search completed candidates..."
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

        {/* Completed Candidates Table */}
        <Card>
          <CardContent className="p-0">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Candidate</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Test Name</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Completion Date</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Score</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Time Taken</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Result</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {completedCandidates.map((candidate) => (
                  <tr key={candidate.id} className="hover:bg-gray-50">
                    <td className="p-4">
                      <div>
                        <div className="font-medium text-gray-800">{candidate.name}</div>
                        <div className="text-sm text-gray-500">{candidate.email}</div>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-gray-600">{candidate.testName}</td>
                    <td className="p-4 text-sm text-gray-600">{candidate.completionDate}</td>
                    <td className="p-4">
                      <span className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-full text-sm font-medium">
                        {candidate.score}%
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-600">{candidate.timeTaken}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        candidate.result === 'Passed' 
                          ? 'bg-green-50 text-green-600' 
                          : 'bg-red-50 text-red-600'
                      }`}>
                        {candidate.result}
                      </span>
                    </td>
                    <td className="p-4">
                      <button className="text-sm text-blue-500 hover:text-blue-600">
                        View Report
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

export default CompletedCandidates; 