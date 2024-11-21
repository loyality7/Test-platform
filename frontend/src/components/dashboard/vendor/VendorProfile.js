import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Avatar,
  Chip,
  Grid,
  LinearProgress
} from '@mui/material';
import { useQuery } from 'react-query';
import { getMethod } from '../../../helpers';

const VendorProfile = ({ open, onClose }) => {
  const { data: profile, isLoading } = useQuery(
    'vendorProfile',
    () => getMethod('vendor/profile', true),
    { enabled: open }
  );

  const getSubscriptionColor = (plan) => {
    switch (plan) {
      case 'premium': return 'success';
      case 'basic': return 'primary';
      default: return 'default';
    }
  };

  if (isLoading) {
    return <LinearProgress />;
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={2}>
          <Avatar 
            sx={{ 
              width: 64, 
              height: 64,
              bgcolor: 'primary.main'
            }}
          >
            {profile?.name?.[0]}
          </Avatar>
          <Box>
            <Typography variant="h6">{profile?.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              {profile?.email}
            </Typography>
          </Box>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Chip 
              label={`${profile?.subscription?.plan?.toUpperCase()} Plan`}
              color={getSubscriptionColor(profile?.subscription?.plan)}
              sx={{ mr: 1 }}
            />
            <Chip 
              label={profile?.status}
              color={profile?.status === 'approved' ? 'success' : 'warning'}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Company Details
            </Typography>
            <Typography variant="body1">{profile?.company}</Typography>
            <Typography variant="body2" color="text.secondary">
              {profile?.phone}
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Address
            </Typography>
            <Typography variant="body2">
              {profile?.address?.street}<br />
              {profile?.address?.city}, {profile?.address?.state}<br />
              {profile?.address?.country} {profile?.address?.zipCode}
            </Typography>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button variant="contained" color="primary">
          Edit Profile
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default VendorProfile; 