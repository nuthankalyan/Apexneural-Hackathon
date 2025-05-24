const express = require('express');
const Document = require('../models/Document');
const Workspace = require('../models/Workspace');
const { authenticateToken } = require('./auth');
const router = express.Router();

// Get all documents for a workspace
router.get('/workspace/:workspaceId', authenticateToken, async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { type } = req.query;
    
    // Check if workspace exists and user has access
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: 'Workspace not found'
      });
    }
    
    // Verify user has access to this workspace
    const hasAccess = workspace.owner.toString() === req.user.userId || 
                     workspace.members.some(member => 
                       member.user.toString() === req.user.userId
                     );

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this workspace'
      });
    }
    
    // Build query
    const query = { 
      workspace: workspaceId,
      isActive: true
    };
    
    // Add type filter if provided
    if (type && ['rfp', 'proposal'].includes(type)) {
      query.type = type;
    }
    
    const documents = await Document.find(query)
      .populate('createdBy', 'username email')
      .sort({ createdAt: -1 });
      
    res.json({
      success: true,
      documents
    });
    
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get a single document by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id)
      .populate('createdBy', 'username email')
      .populate('workspace', 'name');
      
    if (!document || !document.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }
    
    // Check if user has access to the workspace
    const workspace = await Workspace.findById(document.workspace);
    const hasAccess = workspace.owner.toString() === req.user.userId || 
                     workspace.members.some(member => 
                       member.user.toString() === req.user.userId
                     );

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this document'
      });
    }
    
    res.json({
      success: true,
      document
    });
    
  } catch (error) {
    console.error('Error fetching document:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Create new document
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { 
      title, 
      type, 
      content, 
      workspaceId, 
      originalRequest,
      metadata,
      relatedDocumentId
    } = req.body;
    
    // Validation
    if (!title || !content || !workspaceId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }
    
    // Check if workspace exists and user has access
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: 'Workspace not found'
      });
    }
    
    // Verify user has access to this workspace
    const hasAccess = workspace.owner.toString() === req.user.userId || 
                     workspace.members.some(member => 
                       member.user.toString() === req.user.userId
                     );

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this workspace'
      });
    }
    
    const documentData = {
      title,
      type: type || 'rfp',
      content,
      workspace: workspaceId,
      createdBy: req.user.userId,
      originalRequest: originalRequest || '',
      metadata: metadata || {}
    };
    
    // Add related document if provided
    if (relatedDocumentId) {
      documentData.relatedDocuments = [relatedDocumentId];
      
      // Also update the related document to include this new document
      await Document.findByIdAndUpdate(relatedDocumentId, {
        $addToSet: { relatedDocuments: documentData._id }
      });
    }
    
    const document = new Document(documentData);
    await document.save();
    
    // Add document creation to workspace activity
    workspace.activity.push({
      action: `${type || 'document'}_created`,
      user: req.user.userId,
      timestamp: new Date(),
      details: { documentId: document._id, documentTitle: title }
    });
    
    await workspace.save();
    
    res.status(201).json({
      success: true,
      message: 'Document created successfully',
      document
    });
    
  } catch (error) {
    console.error('Error creating document:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete a document (soft delete)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    
    if (!document || !document.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }
    
    // Check if user has access to the workspace
    const workspace = await Workspace.findById(document.workspace);
    const hasAccess = workspace.owner.toString() === req.user.userId || 
                     workspace.members.some(member => 
                       member.user.toString() === req.user.userId &&
                       ['owner', 'admin'].includes(member.role)
                     );

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to delete this document'
      });
    }
    
    // Soft delete
    document.isActive = false;
    await document.save();
    
    res.json({
      success: true,
      message: 'Document deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
