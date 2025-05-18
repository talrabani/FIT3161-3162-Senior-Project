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
  DialogContentText,
  DialogActions,
  TextField,
  Alert,
  Stack,
  Divider,
  Chip,
  Tooltip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import BarChartIcon from '@mui/icons-material/BarChart';
import Navbar from '../components/ui/Navbar';
import AuthService from '../services/auth.service';
import { downloadGraphAsPNG, downloadGraphAsJPEG, downloadGraphAsSVG } from '../components/utils/downloadChart';

const SavedGraphsPage = () => {
  const [savedGraphs, setSavedGraphs] = useState([]);
  const [selectedGraph, setSelectedGraph] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [graphToRename, setGraphToRename] = useState(null);
  const [newGraphName, setNewGraphName] = useState('');
  const [error, setError] = useState(null);
  
  // Load saved graphs from localStorage
  useEffect(() => {
    loadSavedGraphs();
  }, []);

  const loadSavedGraphs = () => {
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
  };

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

  // Handle opening rename dialog
  const handleOpenRenameDialog = (graph) => {
    setGraphToRename(graph);
    setNewGraphName(graph.name || `${graph.type.charAt(0).toUpperCase() + graph.type.slice(1)} Graph`);
    setRenameDialogOpen(true);
  };

  // Handle renaming a graph
  const handleRenameGraph = () => {
    try {
      if (!graphToRename || !newGraphName.trim()) return;

      const currentUser = AuthService.getCurrentUser();
      if (!currentUser || !currentUser.user) {
        setError('Please log in to rename graphs');
        return;
      }

      // Get all graphs
      const allGraphs = JSON.parse(localStorage.getItem('savedGraphs') || '[]');
      
      // Find and update the graph with the new name
      const updatedGraphs = allGraphs.map(graph => {
        if (graph.id === graphToRename.id && graph.userId === currentUser.user.id) {
          return { ...graph, name: newGraphName.trim() };
        }
        return graph;
      });
      
      // Save back to localStorage
      localStorage.setItem('savedGraphs', JSON.stringify(updatedGraphs));
      
      // Update state with renamed graph
      setSavedGraphs(updatedGraphs.filter(graph => graph.userId === currentUser.user.id));
      
      // Close the rename dialog
      setRenameDialogOpen(false);
      setGraphToRename(null);
      setNewGraphName('');
    } catch (err) {
      setError('Error renaming graph');
      console.error('Error renaming graph:', err);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  // Get type-specific icon
  const getGraphTypeIcon = (type) => {
    switch (type) {
      case 'rainfall':
        return <Chip icon={<BarChartIcon />} size="small" label="Rainfall" color="primary" variant="outlined" />;
      case 'max_temp':
        return <Chip icon={<BarChartIcon />} size="small" label="Max Temp" color="error" variant="outlined" />;
      case 'min_temp':
        return <Chip icon={<BarChartIcon />} size="small" label="Min Temp" color="info" variant="outlined" />;
      case 'temp_range':
        return <Chip icon={<BarChartIcon />} size="small" label="Temp Range" color="success" variant="outlined" />;
      default:
        return <Chip icon={<BarChartIcon />} size="small" label={type} variant="outlined" />;
    }
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
                <Card 
                  elevation={2}
                  sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4
                    }
                  }}
                >
                  <CardContent sx={{ flexGrow: 1, p: 3 }}>
                    <Box 
                      sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        mb: 2
                      }}
                    >
                      <Typography variant="h6" fontWeight="bold">
                        {graph.name || `${graph.type.charAt(0).toUpperCase() + graph.type.slice(1)} Graph`}
                      </Typography>
                      {getGraphTypeIcon(graph.type)}
                    </Box>
                    
                    <Divider sx={{ mb: 2 }} />
                    
                    <Stack spacing={1.5} sx={{ mb: 2 }}>
                      <Box display="flex" alignItems="center">
                        <Chip 
                          size="small" 
                          label={`Frequency: ${graph.frequency}`} 
                          variant="outlined"
                          sx={{ mr: 1 }}
                        />
                      </Box>
                      
                      <Box display="flex" alignItems="center">
                        <CalendarTodayIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {formatDate(graph.date)}
                        </Typography>
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary">
                        <strong>Stations:</strong> {graph.stations.join(', ')}
                      </Typography>
                    </Stack>
                  </CardContent>
                  <CardActions sx={{ px: 2, pb: 2, pt: 0 }}>
                    <Button 
                      size="small"
                      variant="contained"
                      color="primary"
                      onClick={() => handlePreviewGraph(graph)}
                      sx={{ mr: 1 }}
                    >
                      Preview
                    </Button>
                    <Tooltip title="Rename">
                      <IconButton 
                        size="small" 
                        color="primary"
                        onClick={() => handleOpenRenameDialog(graph)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton 
                        size="small" 
                        color="error"
                        onClick={() => handleDeleteGraph(graph.id)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
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
            {selectedGraph && `${selectedGraph.name || `${selectedGraph.type.charAt(0).toUpperCase() + selectedGraph.type.slice(1)} Graph`} Preview`}
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

        {/* Rename Graph Dialog */}
        <Dialog
          open={renameDialogOpen}
          onClose={() => setRenameDialogOpen(false)}
        >
          <DialogTitle>Rename Graph</DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ mb: 2 }}>
              Enter a new name for your graph.
            </DialogContentText>
            <TextField
              autoFocus
              margin="dense"
              label="Graph Name"
              type="text"
              fullWidth
              variant="outlined"
              value={newGraphName}
              onChange={(e) => setNewGraphName(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setRenameDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleRenameGraph} 
              color="primary" 
              variant="contained"
              disabled={!newGraphName.trim()}
            >
              Save
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </>
  );
};

export default SavedGraphsPage; 