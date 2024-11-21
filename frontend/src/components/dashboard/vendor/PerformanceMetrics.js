import React from 'react';
import { Box, Typography } from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const PerformanceMetrics = ({ metrics = {} }) => {
  // Sample data - replace with actual metrics from your backend
  const data = [
    { name: 'Jan', avgScore: 65, passRate: 70 },
    { name: 'Feb', avgScore: 68, passRate: 75 },
    { name: 'Mar', avgScore: 75, passRate: 80 },
    { name: 'Apr', avgScore: 72, passRate: 78 },
    { name: 'May', avgScore: 80, passRate: 85 },
    { name: 'Jun', avgScore: 78, passRate: 82 }
  ];

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Performance Trends
      </Typography>
      
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="avgScore"
            stroke="#2196F3"
            name="Average Score"
            strokeWidth={2}
          />
          <Line
            type="monotone"
            dataKey="passRate"
            stroke="#4CAF50"
            name="Pass Rate"
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default PerformanceMetrics; 