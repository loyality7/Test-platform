import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, Table, TableHead, TableRow, TableCell, TableBody, TableContainer, Paper } from '@mui/material';
import apiService from '../../services/api';

const TestSubmissions = () => {
  const { testId } = useParams();
  const [submissions, setSubmissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const results = await apiService.get(`vendor/tests/${testId}/results`);
        
        // Transform the API response to match our table structure
        const transformedSubmissions = results.map(result => ({
          id: result.candidateId,
          candidateName: result.candidateName,
          email: result.email,
          score: result.score,
          submissionDate: new Date(result.submittedAt).toLocaleDateString(),
          status: result.status,
          duration: result.completionTime ? `${Math.round(result.completionTime)} mins` : '-',
          mcqScore: result.mcqScore,
          codingScore: result.codingScore,
          details: result.details
        }));

        setSubmissions(transformedSubmissions);
      } catch (error) {
        console.error('Failed to fetch submissions:', error);
      }
    };

    fetchSubmissions();
  }, [testId]);

  const handleRowClick = async (userId) => {
    try {
      const response = await apiService.get(`vendor/tests/${testId}/users/${userId}/submissions`);
      setSelectedSubmission(response[0]); // Taking the first submission
    } catch (error) {
      console.error('Failed to fetch submission details:', error);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 4 }}>
        Test Submissions
      </Typography>

      <TableContainer component={Paper} sx={{ mb: 4 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Candidate Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell align="right">Total Score</TableCell>
              <TableCell align="right">MCQ Score</TableCell>
              <TableCell align="right">Coding Score</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Submission Date</TableCell>
              <TableCell>Duration</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {submissions.map((submission) => (
              <TableRow 
                key={submission.id}
                onClick={() => handleRowClick(submission.id)}
                sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' } }}
              >
                <TableCell>{submission.candidateName}</TableCell>
                <TableCell>{submission.email}</TableCell>
                <TableCell align="right">{submission.score}%</TableCell>
                <TableCell align="right">{submission.mcqScore}%</TableCell>
                <TableCell align="right">{submission.codingScore}%</TableCell>
                <TableCell>{submission.status}</TableCell>
                <TableCell>{submission.submissionDate}</TableCell>
                <TableCell>{submission.duration}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {selectedSubmission && (
        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography variant="h5" sx={{ mb: 2 }}>
            Submission Details for {selectedSubmission.candidateName}
          </Typography>
          
          {selectedSubmission.details.mcqAnswers?.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>MCQ Answers</Typography>
              {selectedSubmission.details.mcqAnswers.map((answer, index) => (
                <Box key={index} sx={{ mb: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                  <Typography>
                    <strong>Question {index + 1}:</strong> {answer.isCorrect ? '✅' : '❌'}
                  </Typography>
                  <Typography sx={{ mt: 1 }}>Selected Answer: {answer.selectedAnswer}</Typography>
                  <Typography>Correct Answer: {answer.correctAnswer}</Typography>
                  <Typography>Marks: {answer.marks}</Typography>
                </Box>
              ))}
            </Box>
          )}

          {selectedSubmission.details.codingChallenges?.length > 0 && (
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>Coding Challenges</Typography>
              {selectedSubmission.details.codingChallenges.map((challenge, index) => (
                <Box key={challenge._id} sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                    Challenge {index + 1}
                  </Typography>
                  {challenge.submissions.map((submission) => (
                    <Box key={submission._id} sx={{ 
                      p: 2, 
                      bgcolor: 'grey.100', 
                      borderRadius: 1,
                      mb: 2 
                    }}>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        Status: {submission.status}
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        Execution Time: {submission.executionTime}ms
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        Memory Used: {submission.memory}MB
                      </Typography>
                      <Typography sx={{ fontWeight: 'bold', mt: 1 }}>Code:</Typography>
                      <Box sx={{ 
                        bgcolor: 'background.paper',
                        p: 2,
                        borderRadius: 1,
                        overflow: 'auto'
                      }}>
                        <pre style={{ margin: 0 }}>
                          <code>{submission.code}</code>
                        </pre>
                      </Box>
                      
                      <Typography sx={{ fontWeight: 'bold', mt: 2 }}>Test Cases:</Typography>
                      {submission.testCaseResults.map((testCase, i) => (
                        <Box key={testCase._id} sx={{ mt: 1 }}>
                          <Typography variant="body2">
                            Test {i + 1}: {testCase.passed ? '✅' : '❌'}
                          </Typography>
                          <Typography variant="body2" sx={{ ml: 2 }}>
                            Input: {testCase.input}
                          </Typography>
                          <Typography variant="body2" sx={{ ml: 2 }}>
                            Expected: {testCase.expectedOutput}
                          </Typography>
                          <Typography variant="body2" sx={{ ml: 2 }}>
                            Actual: {testCase.actualOutput}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  ))}
                </Box>
              ))}
            </Box>
          )}
        </Paper>
      )}
    </Box>
  );
};

export default TestSubmissions;
