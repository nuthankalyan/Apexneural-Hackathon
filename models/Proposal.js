const mongoose = require('mongoose');

const ProposalSchema = new mongoose.Schema({
  workspaceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true,
  },
  rfpId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Rfp',
  },
  content: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    default: 'Untitled Proposal',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  metadata: {
    type: Object,
    default: {},
  },
});

const Proposal = mongoose.model('Proposal', ProposalSchema);
module.exports = Proposal;
