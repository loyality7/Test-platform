import React from 'react';
import Layout from '../../layout/Layout';
import { Card, CardHeader, CardTitle, CardContent } from '../../common/Card';
import { Download, FileText, Users, Calendar } from 'lucide-react';

const Reports = () => {
  const availableReports = [
    {
      title: 'Test Performance Summary',
      description: 'Detailed analysis of test completion rates and scores',
      icon: FileText,
      lastGenerated: '2024-03-15',
      type: 'PDF'
    },
    {
      title: 'Candidate Progress Report',
      description: 'Overview of candidate performance and completion status',
      icon: Users,
      lastGenerated: '2024-03-14',
      type: 'Excel'
    },
    {
      title: 'Monthly Analytics',
      description: 'Monthly statistics and trends analysis',
      icon: Calendar,
      lastGenerated: '2024-03-01',
      type: 'PDF'
    }
  ];

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-800">Available Reports</h1>
          <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2">
            <Download className="h-4 w-4" />
            Generate New Report
          </button>
        </div>

        <div className="grid gap-6">
          {availableReports.map((report, index) => {
            const Icon = report.icon;
            return (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-4">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <Icon className="h-6 w-6 text-blue-500" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800">{report.title}</h3>
                        <p className="text-sm text-gray-500 mt-1">{report.description}</p>
                        <div className="flex items-center gap-4 mt-3">
                          <span className="text-xs text-gray-500">Last generated: {report.lastGenerated}</span>
                          <span className="text-xs font-medium px-2 py-1 bg-blue-50 text-blue-600 rounded-full">
                            {report.type}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button className="px-3 py-1.5 text-sm text-blue-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-2">
                      <Download className="h-4 w-4" />
                      Download
                    </button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </Layout>
  );
};

export default Reports; 