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
  Alert
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import Navbar from '../components/ui/Navbar';
import AuthService from '../services/auth.service';

const SavedGraphsPage = () => {
  const [savedGraphs, setSavedGraphs] = useState([]);
  const [selectedGraph, setSelectedGraph] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
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
        <Typography variant="h4" component="h1" gutterBottom>
          Saved Graphs
        </Typography>

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
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            {selectedGraph && `${selectedGraph.type.charAt(0).toUpperCase() + selectedGraph.type.slice(1)} Graph Preview`}
          </DialogTitle>
          <DialogContent>
            {selectedGraph && (
              <Box 
                sx={{ 
                  width: '100%', 
                  height: '400px',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  bgcolor: 'background.paper'
                }}
                dangerouslySetInnerHTML={{ __html: selectedGraph.svg }}
              />
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </Container>
    </>
  );
};

export default SavedGraphsPage; 