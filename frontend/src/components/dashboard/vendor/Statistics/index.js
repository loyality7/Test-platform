import React from 'react';
import StatsSummary from './StatsSummary';
import Distribution from './Distribution';
import TrendAnalysis from './TrendAnalysis';
import { TimeRangeSelector } from '../shared/TimeRangeSelector';

const Statistics = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <TimeRangeSelector />
      </div>
      <StatsSummary />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Distribution />
        <TrendAnalysis />
      </div>
    </div>
  );
};

export default Statistics; 