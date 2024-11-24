import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import apiService from '../../services/api';

const Analytics = () => {
  const navigate = useNavigate();
  const [testData, setTestData] = useState([]);
  const [analytics, setAnalytics] = useState({
    totalTests: 0,
    totalCandidates: 0,
    averageScore: 0,
    testCompletion: 0,
    testsByDifficulty: {
      easy: 0,
      medium: 0,
      hard: 0
    }
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [testsResponse, analyticsData] = await Promise.all([
          apiService.get('vendor/tests'),
          apiService.get('vendor/tests/analytics')
        ]);
        
        // Process each test to get its results
        const testsWithResults = await Promise.all(testsResponse.tests.map(async test => {
          const results = await apiService.get(`vendor/tests/${test._id}/results`);
          
          // Calculate test statistics
          const completedSubmissions = results.filter(r => r.status === 'completed');
          const averageScore = completedSubmissions.length > 0
            ? completedSubmissions.reduce((acc, r) => acc + r.score, 0) / completedSubmissions.length
            : 0;
          const passRate = completedSubmissions.length > 0
            ? (completedSubmissions.filter(r => r.score >= test.passingMarks).length / completedSubmissions.length * 100)
            : 0;

          return {
            id: test._id,
            testName: test.title,
            totalCandidates: results.length,
            averageScore: averageScore.toFixed(1),
            passRate: passRate.toFixed(1),
            submissions: completedSubmissions.length,
            difficulty: test.difficulty,
            totalMarks: test.totalMarks,
            passingMarks: test.passingMarks
          };
        }));
        
        setTestData(testsWithResults);
        setAnalytics(analyticsData);
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      }
    };

    fetchData();
  }, []);

  const handleViewSubmissions = (testId) => {
    navigate(`/vendor/analytics/submissions/${testId}`);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 4 }}>
        Analytics Dashboard
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Tests
              </Typography>
              <Typography variant="h5">
                {analytics.totalTests}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Candidates
              </Typography>
              <Typography variant="h5">
                {analytics.totalCandidates}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Average Score
              </Typography>
              <Typography variant="h5">
                {analytics.averageScore?.toFixed(1) || '0.00'}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Test Completion Rate
              </Typography>
              <Typography variant="h5">
                {analytics.testCompletion?.toFixed(1) || '0.00'}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tests Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Test Name</TableCell>
              <TableCell align="right">Total Candidates</TableCell>
              <TableCell align="right">Average Score</TableCell>
              <TableCell align="right">Pass Rate</TableCell>
              <TableCell align="right">Submissions</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {testData.map((test) => (
              <TableRow key={test.id}>
                <TableCell>{test.testName}</TableCell>
                <TableCell align="right">{test.totalCandidates}</TableCell>
                <TableCell align="right">{test.averageScore}%</TableCell>
                <TableCell align="right">{test.passRate}</TableCell>
                <TableCell align="right">{test.submissions}</TableCell>
                <TableCell align="right">
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => handleViewSubmissions(test.id)}
                  >
                    View Submissions
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default Analytics; 