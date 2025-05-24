const mongoose = require('mongoose');

const workspaceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Workspace name is required'],
    trim: true,
    minlength: [1, 'Workspace name cannot be empty'],
    maxlength: [100, 'Workspace name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters'],
    default: 'No description provided'
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Workspace must have an owner']
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['owner', 'admin', 'member', 'viewer'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  settings: {
    isPublic: {
      type: Boolean,
      default: false
    },
    allowInvites: {
      type: Boolean,
      default: true
    },
    theme: {
      type: String,
      enum: ['light', 'dark'],
      default: 'light'
    }
  },
  activity: [{
    action: String,
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    details: mongoose.Schema.Types.Mixed
  }],
  tags: [{
    type: String,
    trim: true
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  lastActivityAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for better performance
workspaceSchema.index({ owner: 1, createdAt: -1 });
workspaceSchema.index({ 'members.user': 1 });
workspaceSchema.index({ name: 'text', description: 'text' });

// Update lastActivityAt before saving
workspaceSchema.pre('save', function(next) {
  this.lastActivityAt = new Date();
  next();
});

// Virtual for member count
workspaceSchema.virtual('memberCount').get(function() {
  return this.members.length;
});

// Method to add member
workspaceSchema.methods.addMember = function(userId, role = 'member') {
  const existingMember = this.members.find(member => 
    member.user.toString() === userId.toString()
  );
  
  if (!existingMember) {
    this.members.push({
      user: userId,
      role: role,
      joinedAt: new Date()
    });
  }
  
  return this.save();
};

// Method to remove member
workspaceSchema.methods.removeMember = function(userId) {
  this.members = this.members.filter(member => 
    member.user.toString() !== userId.toString()
  );
  
  return this.save();
};

// Method to check if user is member
workspaceSchema.methods.isMember = function(userId) {
  // Handle both ObjectId and string comparison
  const userIdStr = userId.toString();
  return this.members.some(member => 
    member.user.toString() === userIdStr
  ) || this.owner.toString() === userIdStr;
};

// Method to get user role in workspace
workspaceSchema.methods.getUserRole = function(userId) {
  const userIdStr = userId.toString();
  
  // Check if user is owner
  if (this.owner.toString() === userIdStr) {
    return 'owner';
  }
  
  // Check if user is member
  const member = this.members.find(member => 
    member.user.toString() === userIdStr
  );
  
  return member ? member.role : null;
};

// Remove sensitive data from JSON output
workspaceSchema.methods.toJSON = function() {
  const workspaceObject = this.toObject();
  return workspaceObject;
};

module.exports = mongoose.model('Workspace', workspaceSchema);
