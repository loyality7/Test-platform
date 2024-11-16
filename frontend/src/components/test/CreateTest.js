import React from 'react';
import { Box, Typography } from '@mui/material';
import Layout from '../layout/Layout';

const CreateTest = () => {
  return (
    <Layout>
      <Box p={3}>
        <Typography variant="h4" gutterBottom>
          Create Test
        </Typography>
      </Box>
    </Layout>
  );
};

export default CreateTest;
