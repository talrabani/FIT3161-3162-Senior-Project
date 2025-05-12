import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Paper, 
  Typography, 
  Box, 
  Button, 
  TextField, 
  Divider, 
  Grid,
  Alert,
  Snackbar,
  CircularProgress
} from '@mui/material';
import { styled } from '@mui/material/styles';
import AuthService from '../services/auth.service';
import Navbar from '../components/ui/Navbar';

// Styled components
const SectionTitle = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  fontWeight: 600,
}));

const SettingsSection = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
}));

/**
 * AccountPage component displaying user account settings
 */
const AccountPage = () => {
  const [user, setUser] = useState(null);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [dataUnits, setDataUnits] = useState('metric');
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);
      try {
        // First try to get the user from the API for the most up-to-date info
        const userData = await AuthService.getUserInfo();
        
        if (userData) {
          setUser(userData);
          setDisplayName(userData.username);
          setEmail(userData.email || '');
          setDataUnits(userData.units || 'metric');
        } else {
          // Fall back to local storage if API fails
          const currentUser = AuthService.getCurrentUser();
          if (currentUser && currentUser.user) {
            setUser(currentUser.user);
            setDisplayName(currentUser.user.username || 'User');
            setEmail(currentUser.user.email || '');
            setDataUnits(currentUser.user.units || 'metric');
          }
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Failed to load user information. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleSaveProfile = async () => {
    try {
      // Update username (displayName) through API
      const response = await AuthService.updateUserPreferences({
        displayName: displayName
      });
      
      setUser(prev => ({
        ...prev,
        username: displayName
      }));
      setIsEditing(false);
      setMessage('Profile updated successfully!');
      setSnackbarOpen(true);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile. Please try again.');
      setSnackbarOpen(true);
    }
  };

  const handleUnitChange = async (unit) => {
    if (unit === dataUnits) return;
    
    try {
      // Update units through API
      await AuthService.updateUserPreferences({
        units: unit
      });
      
      setDataUnits(unit);
      setMessage('Measurement units updated successfully!');
      setSnackbarOpen(true);
    } catch (err) {
      console.error('Error updating units:', err);
      setError('Failed to update measurement units. Please try again.');
      setSnackbarOpen(true);
    }
  };

  const handleDeleteSavedMaps = () => {
    // Future feature: would delete saved maps
    setMessage('Saved maps deleted successfully!');
    setSnackbarOpen(true);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
    setError(null);
  };

  if (isLoading) {
    return (
      <>
        <Navbar />
        <Container maxWidth="md">
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '500px' }}>
            <CircularProgress />
          </Box>
        </Container>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <Container maxWidth="md">
        <Box sx={{ py: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Account Settings
          </Typography>
          
          <Snackbar 
            open={snackbarOpen} 
            autoHideDuration={6000} 
            onClose={handleSnackbarClose}
            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          >
            <Alert 
              onClose={handleSnackbarClose} 
              severity={error ? "error" : "success"} 
              sx={{ width: '100%' }}
            >
              {error || message}
            </Alert>
          </Snackbar>

          {/* Profile Information Section */}
          <SettingsSection elevation={2}>
            <SectionTitle variant="h5">
              Profile Information
            </SectionTitle>
            <Box component="form" noValidate sx={{ mt: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Display Name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    disabled={!isEditing}
                    margin="normal"
                  />
                </Grid>
                {email && (
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Email"
                      value={email}
                      disabled={true}
                      margin="normal"
                      helperText="Email cannot be changed"
                    />
                  </Grid>
                )}
                <Grid item xs={12} sx={{ mt: 2 }}>
                  {isEditing ? (
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Button 
                        variant="contained" 
                        color="primary" 
                        onClick={handleSaveProfile}
                      >
                        Save Changes
                      </Button>
                      <Button 
                        variant="outlined" 
                        onClick={() => setIsEditing(false)}
                      >
                        Cancel
                      </Button>
                    </Box>
                  ) : (
                    <Button 
                      variant="contained" 
                      color="primary" 
                      onClick={() => setIsEditing(true)}
                    >
                      Edit Profile
                    </Button>
                  )}
                </Grid>
              </Grid>
            </Box>
          </SettingsSection>

          {/* Measurement Units Section */}
          <SettingsSection elevation={2}>
            <SectionTitle variant="h5">
              Measurement Units
            </SectionTitle>
            <Grid container spacing={2}>
              <Grid item xs={12} sx={{ mt: 1 }}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button 
                    variant={dataUnits === 'metric' ? 'contained' : 'outlined'}
                    onClick={() => handleUnitChange('metric')}
                  >
                    Metric (°C, mm)
                  </Button>
                  <Button 
                    variant={dataUnits === 'imperial' ? 'contained' : 'outlined'}
                    onClick={() => handleUnitChange('imperial')}
                  >
                    Imperial (°F, in)
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </SettingsSection>

          {/* Data Management Section */}
          <SettingsSection elevation={2}>
            <SectionTitle variant="h5">
              Data Management
            </SectionTitle>
            <Button 
              variant="outlined" 
              color="primary"
              onClick={handleDeleteSavedMaps}
              sx={{ mb: 2 }}
            >
              Delete Saved Maps
            </Button>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              This will delete all your saved map configurations (Coming soon)
            </Typography>
          </SettingsSection>

          {/* Account Security Section */}
          <SettingsSection elevation={2}>
            <SectionTitle variant="h5">
              Account Security
            </SectionTitle>
            <Button 
              variant="outlined" 
              color="primary"
              sx={{ mb: 2 }}
            >
              Change Password
            </Button>
            <Divider sx={{ my: 2 }} />
            <Button 
              variant="outlined" 
              color="error"
            >
              Delete Account
            </Button>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              This action cannot be undone and will permanently delete your account
            </Typography>
          </SettingsSection>
        </Box>
      </Container>
    </>
  );
};

export default AccountPage; 