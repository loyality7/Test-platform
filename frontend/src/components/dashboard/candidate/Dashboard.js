import React from 'react';
import Card from '../../common/Card';

const CandidateDashboard = () => {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Candidate Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card title="Available Tests" value="0" />
        <Card title="Completed Tests" value="0" />
        <Card title="Average Score" value="0%" />
      </div>
    </div>
  );
};

export default CandidateDashboard;
