import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, Typography, Button, Box, CircularProgress, Chip } from '@mui/material';
import { format } from 'date-fns';

const History = ({ userId, workspaceName = 'Default' }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        console.log('Fetching history for user:', userId, 'workspace:', workspaceName);
        const response = await axios.get(`/api/history/${userId}?workspaceName=${workspaceName}`);
        console.log('History response:', response.data);
        
        if (response.data.history && Array.isArray(response.data.history)) {
          setHistory(response.data.history);
        } else {
          console.error('Invalid history data format:', response.data);
          setError('Received invalid history data format');
        }
        setLoading(false);
      } catch (err) {
        console.error('Error fetching history:', err);
        setError(`Failed to load history: ${err.message || 'Unknown error'}`);
        setLoading(false);
      }
    };

    if (userId) {
      fetchHistory();
    } else {
      console.warn('No userId provided to History component');
      setError('User ID is required to fetch history');
      setLoading(false);
    }
  }, [userId, workspaceName]);

  const viewDocument = (document) => {
    // Implement viewing logic
    console.log('Viewing document:', document);
    // You could navigate to a detail page or show a modal
  };

  if (loading) return <CircularProgress />;
  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h5" gutterBottom>Document History</Typography>
      
      {history.length === 0 ? (
        <Typography>No documents generated yet.</Typography>
      ) : (
        history.map((doc) => (
          <Card key={doc._id} sx={{ mb: 2 }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h6">{doc.title}</Typography>
                <Chip 
                  label={doc.rfpId ? 'Proposal' : 'RFP'} 
                  color={doc.rfpId ? 'secondary' : 'primary'} 
                  size="small" 
                />
              </Box>
              
              <Typography variant="body2" color="text.secondary">
                Created: {format(new Date(doc.createdAt), 'PPP p')}
              </Typography>
              
              <Typography variant="body2" sx={{ mt: 1, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                {doc.content.substring(0, 150)}...
              </Typography>
              
              <Button 
                variant="outlined" 
                size="small" 
                onClick={() => viewDocument(doc)} 
                sx={{ mt: 2 }}
              >
                View
              </Button>
            </CardContent>
          </Card>
        ))
      )}
    </Box>
  );
};

export default History;
