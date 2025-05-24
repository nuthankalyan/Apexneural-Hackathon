const express = require('express');
const router = express.Router();
const { getOrCreateWorkspace, saveRfp, saveProposal, getDocumentHistory } = require('../services/documentService');

// Store generated RFP
router.post('/generate-rfp', async (req, res) => {
  try {
    const { userId, content, title, workspaceName = 'Default' } = req.body;
    
    console.log('Saving RFP:', { userId, title, workspaceName });
    
    const workspace = await getOrCreateWorkspace(userId, workspaceName);
    const savedRfp = await saveRfp(workspace._id, content, title || 'Generated RFP');
    
    console.log('RFP saved successfully:', savedRfp._id);
    
    res.json({
      success: true,
      rfp: savedRfp
    });
  } catch (error) {
    console.error('Error saving RFP:', error);
    res.status(500).json({ error: 'Failed to save RFP', details: error.message });
  }
});

// Store generated proposal
router.post('/generate-proposal', async (req, res) => {
  try {
    const { userId, content, title, rfpId, workspaceName = 'Default' } = req.body;
    
    console.log('Saving Proposal:', { userId, title, rfpId, workspaceName });
    
    const workspace = await getOrCreateWorkspace(userId, workspaceName);
    const savedProposal = await saveProposal(workspace._id, content, title || 'Generated Proposal', rfpId);
    
    console.log('Proposal saved successfully:', savedProposal._id);
    
    res.json({
      success: true,
      proposal: savedProposal
    });
  } catch (error) {
    console.error('Error saving proposal:', error);
    res.status(500).json({ error: 'Failed to save proposal', details: error.message });
  }
});

// Get document history - update for better debugging
router.get('/history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { workspaceName = 'Default' } = req.query;
    
    console.log('Fetching history for:', { userId, workspaceName });
    
    const workspace = await getOrCreateWorkspace(userId, workspaceName);
    console.log('Using workspace:', workspace._id);
    
    const history = await getDocumentHistory(workspace._id);
    console.log('History items found:', history.length);
    
    res.json({
      success: true,
      history
    });
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ error: 'Failed to fetch history', details: error.message });
  }
});

// Test endpoint to check database connection and document count
router.get('/debug/documents', async (req, res) => {
  try {
    const workspaceCount = await Workspace.countDocuments();
    const rfpCount = await Rfp.countDocuments();
    const proposalCount = await Proposal.countDocuments();
    
    res.json({
      success: true,
      counts: {
        workspaces: workspaceCount,
        rfps: rfpCount,
        proposals: proposalCount
      }
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    res.status(500).json({ error: 'Error retrieving document counts' });
  }
});

module.exports = router;
