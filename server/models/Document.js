const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Document title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  type: {
    type: String,
    required: true,
    enum: ['rfp', 'proposal'],
    default: 'rfp'
  },
  content: {
    type: String,
    required: [true, 'Document content is required']
  },
  workspace: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: [true, 'Document must belong to a workspace']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Document must have a creator']
  },
  originalRequest: {
    type: String,
    required: false
  },
  relatedDocuments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document'
  }],
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for better performance
documentSchema.index({ workspace: 1, createdAt: -1 });
documentSchema.index({ type: 1 });
documentSchema.index({ title: 'text', content: 'text' });

module.exports = mongoose.model('Document', documentSchema);
