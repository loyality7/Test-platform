import React from 'react';
import Layout from '../../layout/Layout';
import { Card, CardHeader, CardTitle, CardContent } from '../../common/Card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Calendar, Filter } from 'lucide-react';

const TestAnalytics = () => {
  // Sample data for charts
  const testData = [
    { month: 'Jan', tests: 65, passRate: 75 },
    { month: 'Feb', tests: 85, passRate: 82 },
    { month: 'Mar', tests: 95, passRate: 78 },
    { month: 'Apr', tests: 75, passRate: 85 },
    { month: 'May', tests: 88, passRate: 88 },
    { month: 'Jun', tests: 95, passRate: 92 }
  ];

  const testMetrics = [
    {
      title: 'Total Tests Created',
      value: '324',
      change: '+12%',
      trend: 'up'
    },
    {
      title: 'Average Pass Rate',
      value: '76%',
      change: '+5%',
      trend: 'up'
    },
    {
      title: 'Average Completion Time',
      value: '48m',
      change: '-3m',
      trend: 'down'
    },
    {
      title: 'Question Success Rate',
      value: '82%',
      change: '+3%',
      trend: 'up'
    }
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-800">Test Analytics</h1>
          <div className="flex gap-3">
            <button className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Last 30 Days
            </button>
            <button className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filter
            </button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-4 gap-6">
          {testMetrics.map((metric, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">{metric.title}</p>
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-semibold text-gray-800">{metric.value}</h3>
                    <span className={`text-sm px-2 py-1 rounded-full ${
                      metric.trend === 'up' 
                        ? 'bg-green-50 text-green-600' 
                        : 'bg-red-50 text-red-600'
                    }`}>
                      {metric.change}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-2 gap-6">
          <Card>
            <CardHeader className="border-b p-6">
              <CardTitle>Test Completion Trends</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={testData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="tests" fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b p-6">
              <CardTitle>Pass Rate Trends</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={testData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="passRate" stroke="#10b981" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default TestAnalytics; 