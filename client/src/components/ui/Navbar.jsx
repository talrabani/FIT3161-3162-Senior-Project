import React from 'react';
import { AppBar, Toolbar, Typography, Container } from '@mui/material';

/**
 * Simple navigation bar component for the Australian Weather Explorer
 * Currently only displays the application title centered in the navbar
 */
const Navbar = () => {
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
          justifyContent: 'center', 
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
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navbar;
