import React from 'react';
import Layout from '../../layout/Layout';
import { Card, CardHeader, CardTitle, CardContent } from '../../common/Card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Target, TrendingUp, Calendar, Filter } from 'lucide-react';

const PerformanceInsights = () => {
  const performanceData = [
    { month: 'Jan', avgScore: 75, passRate: 82, completion: 88 },
    { month: 'Feb', avgScore: 78, passRate: 85, completion: 85 },
    { month: 'Mar', avgScore: 82, passRate: 88, completion: 90 },
    { month: 'Apr', avgScore: 79, passRate: 84, completion: 87 },
    { month: 'May', avgScore: 85, passRate: 89, completion: 92 },
    { month: 'Jun', avgScore: 88, passRate: 92, completion: 94 }
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-800">Performance Insights</h1>
          <div className="flex gap-3">
            <button className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Last 6 Months
            </button>
            <button className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filter
            </button>
          </div>
        </div>

        {/* Performance Trends Chart */}
        <Card>
          <CardHeader className="border-b p-6">
            <CardTitle>Performance Trends</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="avgScore" stroke="#8b5cf6" name="Average Score" />
                  <Line type="monotone" dataKey="passRate" stroke="#10b981" name="Pass Rate" />
                  <Line type="monotone" dataKey="completion" stroke="#3b82f6" name="Completion Rate" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Key Insights */}
        <div className="grid grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-medium text-gray-800 mb-4">Top Performing Areas</h3>
              <div className="space-y-4">
                {/* Add your insights content here */}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-medium text-gray-800 mb-4">Areas for Improvement</h3>
              <div className="space-y-4">
                {/* Add your insights content here */}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-medium text-gray-800 mb-4">Recommendations</h3>
              <div className="space-y-4">
                {/* Add your recommendations content here */}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default PerformanceInsights;