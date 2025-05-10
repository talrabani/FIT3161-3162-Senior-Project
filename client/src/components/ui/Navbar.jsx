import React from 'react';
import { AppBar, Toolbar, Typography, Container, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AuthService from '../../services/auth.service';

/**
 * Simple navigation bar component for the Australian Weather Explorer
 * Currently only displays the application title centered in the navbar
 */
const Navbar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    AuthService.signout();
    navigate('/login');
    window.location.reload(); // Force a page reload to clear any cached state
  };

  return (
    <AppBar 
      position="static" 
      elevation={2} 
      sx={{ 
        backgroundColor: 'rgba(198, 166, 6, 0.9)',
        borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
        marginBottom: '0.5rem'
      }}
    >
      <Container maxWidth="xl">
        <Toolbar disableGutters sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          height: { xs: '56px', sm: '64px' }
        }}>
          <Typography
            variant="h6"
            component="div"
            className="navbar-brand"
            sx={{
              fontWeight: 600,
              color: 'white',
              textAlign: 'center',
              letterSpacing: '0.5px',
              fontSize: { xs: '1.1rem', sm: '1.25rem' }
            }}
          >
            Australian Weather Explorer
          </Typography>
          
          <Button 
            onClick={handleLogout}
            sx={{
              color: 'white',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)'
              }
            }}
          >
            Logout
          </Button>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navbar;
