import React from 'react';
import { Box, Typography } from '@mui/material';
import Layout from '../../components/layout/Layout';

const Profile = () => {
  return (
    <Layout>
      <Box p={3}>
        <Typography variant="h4" gutterBottom>
          Vendor Profile
        </Typography>
        {/* Add profile management content here */}
      </Box>
    </Layout>
  );
};

export default Profile; 