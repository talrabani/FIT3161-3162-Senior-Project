import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Grid, 
  Card, 
  CardContent,
  CardActions,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Stack,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import Navbar from '../components/ui/Navbar';
import AuthService from '../services/auth.service';
import { downloadGraphAsPNG, downloadGraphAsJPEG, downloadGraphAsSVG } from '../components/utils/downloadChart';

const SavedGraphsPage = () => {
  const [savedGraphs, setSavedGraphs] = useState([]);
  const [selectedGraph, setSelectedGraph] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [error, setError] = useState(null);
  
  // Load saved graphs from localStorage
  useEffect(() => {
    try {
      const currentUser = AuthService.getCurrentUser();
      if (!currentUser || !currentUser.user) {
        setError('Please log in to view saved graphs');
        return;
      }

      const allGraphs = JSON.parse(localStorage.getItem('savedGraphs') || '[]');
      // Filter graphs for current user
      const userGraphs = allGraphs.filter(graph => graph.userId === currentUser.user.id);
      setSavedGraphs(userGraphs);
    } catch (err) {
      setError('Error loading saved graphs');
      console.error('Error loading saved graphs:', err);
    }
  }, []);

  // Handle graph deletion
  const handleDeleteGraph = (graphId) => {
    try {
      const currentUser = AuthService.getCurrentUser();
      if (!currentUser || !currentUser.user) {
        setError('Please log in to delete graphs');
        return;
      }

      // Get all graphs
      const allGraphs = JSON.parse(localStorage.getItem('savedGraphs') || '[]');
      
      // Remove the graph with matching ID and user ID
      const updatedGraphs = allGraphs.filter(graph => 
        !(graph.id === graphId && graph.userId === currentUser.user.id)
      );
      
      // Save back to localStorage
      localStorage.setItem('savedGraphs', JSON.stringify(updatedGraphs));
      
      // Update state with filtered graphs for current user
      setSavedGraphs(updatedGraphs.filter(graph => graph.userId === currentUser.user.id));
    } catch (err) {
      setError('Error deleting graph');
      console.error('Error deleting graph:', err);
    }
  };

  // Handle removing all graphs
  const handleRemoveAllGraphs = () => {
    try {
      const currentUser = AuthService.getCurrentUser();
      if (!currentUser || !currentUser.user) {
        setError('Please log in to delete graphs');
        return;
      }

      // Get all graphs
      const allGraphs = JSON.parse(localStorage.getItem('savedGraphs') || '[]');
      
      // Remove all graphs for the current user
      const updatedGraphs = allGraphs.filter(graph => graph.userId !== currentUser.user.id);
      
      // Save back to localStorage
      localStorage.setItem('savedGraphs', JSON.stringify(updatedGraphs));
      
      // Update state - should be empty now
      setSavedGraphs([]);
      setConfirmDialogOpen(false);
    } catch (err) {
      setError('Error removing all graphs');
      console.error('Error removing all graphs:', err);
    }
  };

  // Handle graph preview
  const handlePreviewGraph = (graph) => {
    setSelectedGraph(graph);
    setDialogOpen(true);
  };

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <>
      <Navbar />
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1">
            Saved Graphs
          </Typography>
          {savedGraphs.length > 0 && (
            <Button 
              variant="contained" 
              color="error" 
              onClick={() => setConfirmDialogOpen(true)}
              startIcon={<DeleteIcon />}
            >
              Remove All
            </Button>
          )}
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {savedGraphs.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="text.secondary">
              No saved graphs yet
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
              Save graphs from the comparison page to view them here
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {savedGraphs.map((graph) => (
              <Grid item xs={12} sm={6} md={4} key={graph.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" gutterBottom>
                      {graph.type.charAt(0).toUpperCase() + graph.type.slice(1)} Graph
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Frequency: {graph.frequency}
                      
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Saved: {formatDate(graph.date)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Stations: {graph.stations.join(', ')}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button 
                      size="small" 
                      onClick={() => handlePreviewGraph(graph)}
                    >
                      Preview
                    </Button>
                    <IconButton 
                      size="small" 
                      color="error"
                      onClick={() => handleDeleteGraph(graph.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Preview Dialog */}
        <Dialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          maxWidth={false}
          fullWidth
          PaperProps={{
            sx: {
              maxHeight: '90vh',
              width: '95%',
              maxWidth: '1500px'
            }
          }}
        >
          <DialogTitle>
            {selectedGraph && `${selectedGraph.type.charAt(0).toUpperCase() + selectedGraph.type.slice(1)} Graph Preview`}
          </DialogTitle>
          <DialogContent>
            {selectedGraph && (
               <Stack 
                  direction='column' 
                  spacing={2} 
                  justifyContent="center"
                >
                  <Box 
                    sx={{ 
                      width: '100%', 
                      height: '600px',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      bgcolor: 'background.paper',
                      '& svg': {
                        width: 'auto',
                        height: 'auto',
                        maxWidth: '100%',
                        maxHeight: '100%'
                      }
                    }}
                    dangerouslySetInnerHTML={{ __html: selectedGraph.svg }}
                  />
                  <Stack 
                    direction='row' 
                    spacing={2} 
                    justifyContent="center"
                  >
                    <Button
                      variant="contained" 
                      color="primary"
                      size="small"
                      // disabled={!hasData}
                      sx={{ 
                        fontSize: '0.8rem',
                        backgroundColor: '#3949ab',
                        '&:hover': {
                          backgroundColor: '#1a237e'
                        }
                      }}
                      onClick={downloadGraphAsSVG}
                    >
                      Download as SVG
                    </Button>
                    <Button
                      variant="contained" 
                      color="primary"
                      size="small"
                      // disabled={!hasData}
                      sx={{ 
                        fontSize: '0.8rem',
                        backgroundColor: '#3949ab',
                        '&:hover': {
                          backgroundColor: '#1a237e'
                        }
                      }}
                      onClick={downloadGraphAsPNG}
                    >
                      Download as PNG
                    </Button>
                    <Button
                      variant="contained" 
                      color="primary"
                      size="small"
                      // disabled={!hasData}
                      sx={{ 
                        fontSize: '0.8rem',
                        backgroundColor: '#3949ab',
                        '&:hover': {
                          backgroundColor: '#1a237e'
                        }
                      }}
                      onClick={downloadGraphAsJPEG}
                    >
                      Download as JPEG
                    </Button>
                </Stack>
                </Stack>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* Confirmation Dialog for Remove All */}
        <Dialog
          open={confirmDialogOpen}
          onClose={() => setConfirmDialogOpen(false)}
        >
          <DialogTitle>Confirm Removal</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to remove all saved graphs? This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleRemoveAllGraphs} color="error" variant="contained">
              Remove All
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </>
  );
};

export default SavedGraphsPage; 