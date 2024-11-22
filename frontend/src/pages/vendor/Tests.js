import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, 
  Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Paper,
  IconButton, Snackbar, Alert, Chip
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import PublishIcon from '@mui/icons-material/Publish';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import { motion } from 'framer-motion';
import { styled, alpha } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import apiService from '../../services/api';

const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
  borderRadius: theme.spacing(2),
  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
  overflow: 'hidden',
  '& .MuiTableCell-root': {
    borderColor: alpha(theme.palette.divider, 0.1),
  },
}));

const ActionButton = styled(IconButton)(({ theme }) => ({
  transition: 'transform 0.2s',
  '&:hover': {
    transform: 'scale(1.1)',
  },
}));

const CreateButton = styled(Button)(({ theme }) => ({
  borderRadius: theme.spacing(3),
  padding: theme.spacing(1, 4),
  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  transition: 'transform 0.2s',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 6px 16px rgba(0,0,0,0.2)',
  },
}));

const Tests = () => {
  const navigate = useNavigate();
  const [tests, setTests] = useState([]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    try {
      const response = await apiService.get('/vendor/tests');
      console.log('Fetch tests response:', response);
      
      if (!response) {
        throw new Error('No response from server');
      }
      if (Array.isArray(response.tests)) {
        setTests(response.tests);
      } else if (Array.isArray(response.data?.tests)) {
        setTests(response.data.tests);
      } else {
        console.log('Invalid response format:', response);
        setSnackbar({
          open: true,
          message: response.error || 'Failed to fetch tests',
          severity: 'error'
        });
        setTests([]);
      }
    } catch (error) {
      console.log('Full error object:', error);
      console.error('Error fetching tests:', error.message);
      setSnackbar({
        open: true,
        message: error.message || 'Failed to fetch tests',
        severity: 'error'
      });
      setTests([]);
    }
  };

  const handleStatusToggle = async (id, currentStatus) => {
    try {
      const response = await apiService.put(`tests/${id}`, { 
        status: currentStatus === 'published' ? 'draft' : 'published' 
      });
      console.log('Status toggle response:', response);
      if (response.success) {
        fetchTests();
      }
    } catch (error) {
      console.log('Status toggle error:', error);
      console.error('Error updating test status:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await apiService.delete(`tests/${id}`);
      if (response.success) {
        setSnackbar({
          open: true,
          message: 'Test deleted successfully',
          severity: 'success'
        });
        fetchTests();
      }
    } catch (error) {
      console.error('Error deleting test:', error);
      setSnackbar({
        open: true,
        message: 'Failed to delete test',
        severity: 'error'
      });
    }
  };

  const handlePublish = async (id) => {
    try {
      const response = await apiService.post(`tests/${id}/publish`);
      console.log('Publish response:', response);
      
      if (response && (response.message || response.data)) {
        const shareableLink = response.shareableLink || response.data?.shareableLink;
        
        // Copy link to clipboard
        if (shareableLink) {
          await navigator.clipboard.writeText(shareableLink);
        }

        setSnackbar({
          open: true,
          message: (
            <Box>
              <div>Test published successfully!</div>
              {shareableLink && (
                <Box sx={{ mt: 1, wordBreak: 'break-all' }}>
                  <Typography variant="body2">
                    Shareable link copied to clipboard: 
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    {shareableLink}
                  </Typography>
                </Box>
              )}
            </Box>
          ),
          severity: 'success'
        });
        
        fetchTests(); // Refresh the list
      } else {
        throw new Error(response.error || 'Failed to publish test');
      }
    } catch (error) {
      console.error('Error publishing test:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Failed to publish test',
        severity: 'error'
      });
    }
  };

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box p={3}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
            <motion.div
              initial={{ x: -20 }}
              animate={{ x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Typography 
                variant="h4" 
                sx={{ 
                  fontWeight: 600,
                  background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                Tests Management
              </Typography>
            </motion.div>
            
            <CreateButton
              variant="contained"
              color="primary"
              onClick={() => navigate('/vendor/tests/create')}
              startIcon={<AddIcon />}
            >
              Create New Test
            </CreateButton>
          </Box>
          
          <StyledTableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'primary.light' }}>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Title</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Description</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Duration</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Total Marks</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Passing Marks</TableCell>
                  <TableCell align="center" sx={{ color: 'white', fontWeight: 600 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tests.map((test, index) => (
                  <motion.tr
                    key={test._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    component={TableRow}
                    sx={{
                      '&:hover': {
                        bgcolor: 'action.hover',
                      },
                    }}
                  >
                    <TableCell>{test.title}</TableCell>
                    <TableCell>{test.description}</TableCell>
                    <TableCell>{test.duration} min</TableCell>
                    <TableCell>
                      <Chip
                        label={test.status}
                        color={test.status === 'published' ? 'success' : 'default'}
                        size="small"
                        sx={{ borderRadius: '4px' }}
                      />
                    </TableCell>
                    <TableCell>{test.totalMarks}</TableCell>
                    <TableCell>{test.passingMarks}</TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                        <ActionButton 
                          color="primary"
                          onClick={() => navigate(`/vendor/tests/edit/${test._id}`)}
                        >
                          <EditIcon />
                        </ActionButton>
                        <ActionButton
                          color="info"
                          onClick={() => handleStatusToggle(test._id, test.status)}
                        >
                          {test.status === 'published' ? <VisibilityIcon /> : <VisibilityOffIcon />}
                        </ActionButton>
                        <ActionButton
                          color="success"
                          onClick={() => handlePublish(test._id)}
                        >
                          <PublishIcon />
                        </ActionButton>
                        <ActionButton
                          color="error"
                          onClick={() => handleDelete(test._id)}
                        >
                          <DeleteIcon />
                        </ActionButton>
                      </Box>
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </StyledTableContainer>
        </Box>
        
        <Snackbar 
          open={snackbar.open} 
          autoHideDuration={6000} 
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        >
          <Alert 
            onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} 
            severity={snackbar.severity}
            sx={{ 
              borderRadius: 2,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              maxWidth: '100%'  // Added to ensure long links don't overflow
            }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </motion.div>
    </Layout>
  );
};

export default Tests; 