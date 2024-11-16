import React from 'react';
import { Box, Typography } from '@mui/material';
import Layout from '../../components/layout/Layout';

const Invitations = () => {
  return (
    <Layout>
      <Box p={3}>
        <Typography variant="h4" gutterBottom>
          Test Invitations
        </Typography>
        {/* Add invitations management content here */}
      </Box>
    </Layout>
  );
};

export default Invitations; 