const express = require('express');
const Workspace = require('../models/Workspace');
const { authenticateToken } = require('./auth');
const router = express.Router();

// Get all workspaces for the authenticated user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const workspaces = await Workspace.find({
      $or: [
        { owner: req.user.userId },
        { 'members.user': req.user.userId }
      ],
      isActive: true
    })
    .populate('owner', 'username email')
    .populate('members.user', 'username email')
    .sort({ lastActivityAt: -1 });

    res.json({
      success: true,
      workspaces
    });
  } catch (error) {
    console.error('Error fetching workspaces:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Create new workspace
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, description, tags, settings } = req.body;

    // Validation
    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Workspace name is required'
      });
    }

    // Check if user already has a workspace with this name
    const existingWorkspace = await Workspace.findOne({
      owner: req.user.userId,
      name: name.trim(),
      isActive: true
    });

    if (existingWorkspace) {
      return res.status(400).json({
        success: false,
        message: 'You already have a workspace with this name'
      });
    }

    // Create workspace
    const workspace = new Workspace({
      name: name.trim(),
      description: description?.trim() || 'No description provided',
      owner: req.user.userId,
      members: [{
        user: req.user.userId,
        role: 'owner',
        joinedAt: new Date()
      }],
      tags: tags || [],
      settings: {
        isPublic: settings?.isPublic || false,
        allowInvites: settings?.allowInvites !== false,
        theme: settings?.theme || 'light'
      },
      activity: [{
        action: 'workspace_created',
        user: req.user.userId,
        timestamp: new Date(),
        details: { workspaceName: name.trim() }
      }]
    });

    await workspace.save();

    // Populate the response
    const populatedWorkspace = await Workspace.findById(workspace._id)
      .populate('owner', 'username email')
      .populate('members.user', 'username email');

    res.status(201).json({
      success: true,
      message: 'Workspace created successfully',
      workspace: populatedWorkspace
    });

  } catch (error) {
    console.error('Error creating workspace:', error);
    
    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: messages[0]
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get workspace by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id)
      .populate('owner', 'username email')
      .populate('members.user', 'username email')
      .populate('activity.user', 'username email');

    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: 'Workspace not found'
      });
    }

    // Check if workspace is active
    if (!workspace.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Workspace not found'
      });
    }

    // Check if user has access to this workspace
    const hasAccess = workspace.owner._id.toString() === req.user.userId || 
                     workspace.members.some(member => 
                       member.user._id.toString() === req.user.userId
                     );

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this workspace'
      });
    }

    res.json({
      success: true,
      workspace
    });
  } catch (error) {
    console.error('Error fetching workspace:', error);
    
    // Handle invalid ObjectId
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Invalid workspace ID'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update workspace
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { name, description, tags, settings } = req.body;

    const workspace = await Workspace.findById(req.params.id);

    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: 'Workspace not found'
      });
    }

    // Check if user is owner or admin
    const userRole = workspace.getUserRole(req.user.userId);
    if (workspace.owner.toString() !== req.user.userId && userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only workspace owner or admin can update workspace'
      });
    }

    // Update fields
    if (name !== undefined) workspace.name = name.trim();
    if (description !== undefined) workspace.description = description.trim();
    if (tags !== undefined) workspace.tags = tags;
    if (settings !== undefined) {
      workspace.settings = { ...workspace.settings, ...settings };
    }

    // Add activity log
    workspace.activity.push({
      action: 'workspace_updated',
      user: req.user.userId,
      timestamp: new Date(),
      details: { updatedFields: Object.keys(req.body) }
    });

    await workspace.save();

    const updatedWorkspace = await Workspace.findById(workspace._id)
      .populate('owner', 'username email')
      .populate('members.user', 'username email');

    res.json({
      success: true,
      message: 'Workspace updated successfully',
      workspace: updatedWorkspace
    });

  } catch (error) {
    console.error('Error updating workspace:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete workspace (soft delete)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id);

    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: 'Workspace not found'
      });
    }

    // Only owner can delete workspace
    if (workspace.owner.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Only workspace owner can delete workspace'
      });
    }

    // Soft delete
    workspace.isActive = false;
    workspace.activity.push({
      action: 'workspace_deleted',
      user: req.user.userId,
      timestamp: new Date(),
      details: { deletedAt: new Date() }
    });

    await workspace.save();

    res.json({
      success: true,
      message: 'Workspace deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting workspace:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Add member to workspace
router.post('/:id/members', authenticateToken, async (req, res) => {
  try {
    const { userId, role = 'member' } = req.body;
    const workspace = await Workspace.findById(req.params.id);

    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: 'Workspace not found'
      });
    }

    // Check permissions
    const userRole = workspace.getUserRole(req.user.userId);
    if (workspace.owner.toString() !== req.user.userId && userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only workspace owner or admin can add members'
      });
    }

    await workspace.addMember(userId, role);

    workspace.activity.push({
      action: 'member_added',
      user: req.user.userId,
      timestamp: new Date(),
      details: { addedUserId: userId, role }
    });

    await workspace.save();

    res.json({
      success: true,
      message: 'Member added successfully'
    });

  } catch (error) {
    console.error('Error adding member:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Remove member from workspace
router.delete('/:id/members/:userId', authenticateToken, async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id);

    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: 'Workspace not found'
      });
    }

    // Check permissions
    const userRole = workspace.getUserRole(req.user.userId);
    if (workspace.owner.toString() !== req.user.userId && userRole !== 'admin' && req.user.userId !== req.params.userId) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    await workspace.removeMember(req.params.userId);

    workspace.activity.push({
      action: 'member_removed',
      user: req.user.userId,
      timestamp: new Date(),
      details: { removedUserId: req.params.userId }
    });

    await workspace.save();

    res.json({
      success: true,
      message: 'Member removed successfully'
    });

  } catch (error) {
    console.error('Error removing member:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
