import React from 'react';
import Layout from '../../layout/Layout';
import { Card, CardHeader, CardTitle, CardContent } from '../../common/Card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users2, Calendar, Filter } from 'lucide-react';

const CandidateAnalytics = () => {
  const candidateMetrics = [
    {
      title: 'Total Candidates',
      value: '1,245',
      change: '+8%',
      trend: 'up'
    },
    {
      title: 'Active Candidates',
      value: '234',
      change: '+12%',
      trend: 'up'
    },
    {
      title: 'Average Score',
      value: '76%',
      change: '+3%',
      trend: 'up'
    },
    {
      title: 'Completion Rate',
      value: '82%',
      change: '+5%',
      trend: 'up'
    }
  ];

  const performanceData = [
    { range: '0-20%', candidates: 15 },
    { range: '21-40%', candidates: 25 },
    { range: '41-60%', candidates: 45 },
    { range: '61-80%', candidates: 65 },
    { range: '81-100%', candidates: 35 }
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-800">Candidate Analytics</h1>
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
          {candidateMetrics.map((metric, index) => (
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

        {/* Performance Distribution Chart */}
        <Card>
          <CardHeader className="border-b p-6">
            <CardTitle>Performance Distribution</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="candidates" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default CandidateAnalytics;