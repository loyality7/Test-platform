import React from 'react';
import Layout from '../../layout/Layout';
import { Card, CardHeader, CardTitle, CardContent } from '../../common/Card';
import { Download, Filter, Calendar, Search } from 'lucide-react';

const Invoices = () => {
  const invoices = [
    {
      id: 'INV-2024-001',
      date: '2024-03-15',
      amount: 299.00,
      status: 'Paid',
      description: 'Professional Plan - Monthly'
    },
    {
      id: 'INV-2024-002',
      date: '2024-02-15',
      amount: 299.00,
      status: 'Paid',
      description: 'Professional Plan - Monthly'
    }
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-800">Invoices</h1>
          <div className="flex gap-3">
            <button className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filter
            </button>
            <button className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Date Range
            </button>
          </div>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search invoices..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-100 outline-none"
              />
            </div>
          </CardContent>
        </Card>

        {/* Invoices Table */}
        <Card>
          <CardContent className="p-0">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Invoice</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Date</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Description</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Amount</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Status</th>
                  <th className="text-right p-4 text-sm font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="p-4">
                      <span className="font-medium text-gray-800">{invoice.id}</span>
                    </td>
                    <td className="p-4 text-gray-600">{invoice.date}</td>
                    <td className="p-4 text-gray-600">{invoice.description}</td>
                    <td className="p-4 text-gray-800">${invoice.amount.toFixed(2)}</td>
                    <td className="p-4">
                      <span className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-full text-sm">
                        {invoice.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button className="text-blue-500 hover:text-blue-600">
                        <Download className="h-4 w-4" />
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

export default Invoices; 