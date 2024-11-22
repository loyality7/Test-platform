import React from 'react';
import ReportsList from './ReportsList';
import ReportFilters from './ReportFilters';
import { TimeRangeSelector } from '../shared/TimeRangeSelector';

const Reports = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <ReportFilters />
        <TimeRangeSelector />
      </div>
      <ReportsList />
    </div>
  );
};

export default Reports; 