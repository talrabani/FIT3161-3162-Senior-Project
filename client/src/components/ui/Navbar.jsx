import React from 'react';
import { AppBar, Toolbar, Typography, Container, Button, Box } from '@mui/material';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import AuthService from '../../services/auth.service';
import TutorialModal from './TutorialModal';
import useTutorial from '../../hooks/useTutorial';

/**
 * Navigation bar component for the Australian Weather Explorer
 * Includes navigation links and user account options
 */
const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { tutorialOpen, openTutorial, closeTutorial } = useTutorial();

  const handleLogout = () => {
    AuthService.signout();
    navigate('/login');
    window.location.reload(); // Force a page reload to clear any cached state
  };
  
  // Helper function to determine if a navigation link is active
  const isActive = (path) => {
    if (path === '/' && (location.pathname === '/' || location.pathname === '/map')) {
      return true;
    }
    if (path === '/comparison' && location.pathname === '/comparison') {
      return true;
    }
    return location.pathname === path;
  };

  return (
    <>
      <AppBar 
        position="static" 
        elevation={3}
        sx={{ 
          background: 'linear-gradient(90deg, #1a237e 0%, #3949ab 100%)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          marginBottom: '0.5rem'
        }}
      >
        <Container maxWidth="xl">
          <Toolbar disableGutters sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            height: { xs: '56px', sm: '64px' }
          }}>
            {/* Left side navigation links */}
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography
                variant="h6"
                component="div"
                className="navbar-brand"
                sx={{
                  fontWeight: 600,
                  color: 'white',
                  textAlign: 'center',
                  letterSpacing: '0.5px',
                  fontSize: { xs: '1.1rem', sm: '1.25rem' },
                  marginRight: 4
                }}
              >
                Australian Weather Explorer
              </Typography>
              
              <Box sx={{ display: { xs: 'none', md: 'flex' } }}>
                <Button 
                  onClick={openTutorial}
                  sx={{
                    color: 'white',
                    fontWeight: 500,
                    borderRadius: 0,
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    },
                    mx: 1,
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <Box component="span" sx={{ mr: 0.5, fontSize: '1.2rem' }}>ℹ️</Box>
                  Tutorial
                </Button>
                
                <Button 
                  component={RouterLink} 
                  to="/"
                  sx={{
                    color: 'white',
                    fontWeight: isActive('/') ? 700 : 400,
                    borderBottom: isActive('/') ? '2px solid white' : 'none',
                    borderRadius: 0,
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    },
                    mx: 1
                  }}
                >
                  <Box component="span" sx={{ mr: 0.5, fontSize: '1.2rem' }}>🗺️</Box>
                  Map
                </Button>
                <Button 
                  component={RouterLink} 
                  to="/comparison"
                  sx={{
                    color: 'white',
                    fontWeight: isActive('/comparison') ? 700 : 400,
                    borderBottom: isActive('/comparison') ? '2px solid white' : 'none',
                    borderRadius: 0,
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    },
                    mx: 1
                  }}
                >
                  <Box component="span" sx={{ mr: 0.5, fontSize: '1.2rem' }}>📊</Box>
                  Graph
                </Button>
                <Button 
                  component={RouterLink} 
                  to="/saved-graphs"
                  sx={{
                    color: 'white',
                    fontWeight: isActive('/saved-graphs') ? 700 : 400,
                    borderBottom: isActive('/saved-graphs') ? '2px solid white' : 'none',
                    borderRadius: 0,
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    },
                    mx: 1
                  }}
                >
                  <Box component="span" sx={{ mr: 0.5, fontSize: '1.2rem' }}>💾</Box>
                  Saved Graphs
                </Button>
              </Box>
            </Box>
            
            {/* Right side account options */}
            <Box sx={{ display: 'flex' }}>
              <Button 
                component={RouterLink}
                to="/account"
                sx={{
                  color: 'white',
                  fontWeight: isActive('/account') ? 700 : 400,
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    transition: 'all 0.2s ease'
                  },
                  transition: 'all 0.2s ease',
                  mr: 1
                }}
              >
                <Box component="span" sx={{ mr: 0.5, fontSize: '1.2rem' }}>👤</Box>
                Account Settings
              </Button>
              
              <Button 
                onClick={handleLogout}
                sx={{
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    transition: 'all 0.2s ease'
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                <Box component="span" sx={{ mr: 0.5, fontSize: '1.2rem' }}>🚪</Box>
                Logout
              </Button>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>
      
      {/* Tutorial Modal */}
      <TutorialModal
        open={tutorialOpen}
        onClose={closeTutorial}
      />
    </>
  );
};

export default Navbar;
