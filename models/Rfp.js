const mongoose = require('mongoose');

const RfpSchema = new mongoose.Schema({
  workspaceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    default: 'Untitled RFP',
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

const Rfp = mongoose.model('Rfp', RfpSchema);
module.exports = Rfp;
