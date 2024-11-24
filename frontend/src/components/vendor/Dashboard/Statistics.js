import React from 'react';
import Layout from '../../layout/Layout';
import { Card, CardHeader, CardTitle, CardContent } from '../../common/Card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const Statistics = () => {
  // Sample data for charts
  const monthlyData = [
    { month: 'Jan', tests: 65, passRate: 75 },
    { month: 'Feb', tests: 85, passRate: 82 },
    { month: 'Mar', tests: 95, passRate: 78 },
    { month: 'Apr', tests: 75, passRate: 85 },
    { month: 'May', tests: 88, passRate: 88 },
    { month: 'Jun', tests: 95, passRate: 92 }
  ];

  const skillDistribution = [
    { skill: 'JavaScript', score: 85 },
    { skill: 'Python', score: 78 },
    { skill: 'Java', score: 72 },
    { skill: 'React', score: 88 },
    { skill: 'Node.js', score: 76 }
  ];

  return (
    <Layout>
      <div className="space-y-8">
        <h1 className="text-2xl font-semibold text-gray-800">Statistics Overview</h1>

        <div className="grid grid-cols-2 gap-6">
          {/* Monthly Tests Chart */}
          <Card>
            <CardHeader className="border-b p-6">
              <CardTitle>Monthly Test Completion</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="tests" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Pass Rate Trend */}
          <Card>
            <CardHeader className="border-b p-6">
              <CardTitle>Pass Rate Trend</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="passRate" stroke="#22c55e" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Skill Distribution */}
          <Card className="col-span-2">
            <CardHeader className="border-b p-6">
              <CardTitle>Skill Distribution</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={skillDistribution} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="skill" type="category" />
                    <Tooltip />
                    <Bar dataKey="score" fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Statistics; 