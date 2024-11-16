import React from 'react';
import { Box, Typography } from '@mui/material';
import Layout from '../../components/layout/Layout';

const Tests = () => {
  return (
    <Layout>
      <Box p={3}>
        <Typography variant="h4" gutterBottom>
          Tests Management
        </Typography>
        {/* Add your tests management content here */}
      </Box>
    </Layout>
  );
};

export default Tests; 