const Workspace = require('../models/Workspace');
const Rfp = require('../models/Rfp');
const Proposal = require('../models/Proposal');

// Workspace operations
const getOrCreateWorkspace = async (userId, workspaceName = 'Default') => {
  let workspace = await Workspace.findOne({ userId, name: workspaceName });
  
  if (!workspace) {
    workspace = new Workspace({
      userId,
      name: workspaceName,
      description: 'Auto-created workspace',
    });
    await workspace.save();
  }
  
  return workspace;
};

// RFP operations
const saveRfp = async (workspaceId, content, title = 'Generated RFP', metadata = {}) => {
  const rfp = new Rfp({
    workspaceId,
    content,
    title,
    metadata,
  });
  await rfp.save();
  return rfp;
};

const getRfpsByWorkspace = async (workspaceId) => {
  return await Rfp.find({ workspaceId }).sort({ createdAt: -1 });
};

// Proposal operations
const saveProposal = async (workspaceId, content, title = 'Generated Proposal', rfpId = null, metadata = {}) => {
  const proposal = new Proposal({
    workspaceId,
    rfpId,
    content,
    title,
    metadata,
  });
  await proposal.save();
  return proposal;
};

const getProposalsByWorkspace = async (workspaceId) => {
  return await Proposal.find({ workspaceId }).sort({ createdAt: -1 });
};

const getDocumentHistory = async (workspaceId) => {
  console.log('Getting document history for workspace:', workspaceId);
  
  const rfps = await Rfp.find({ workspaceId }).sort({ createdAt: -1 });
  console.log('Found RFPs:', rfps.length);
  
  const proposals = await Proposal.find({ workspaceId }).sort({ createdAt: -1 });
  console.log('Found Proposals:', proposals.length);
  
  // Combine and sort by creation date
  const history = [...rfps, ...proposals].sort((a, b) => b.createdAt - a.createdAt);
  return history;
};

module.exports = {
  getOrCreateWorkspace,
  saveRfp,
  getRfpsByWorkspace,
  saveProposal,
  getProposalsByWorkspace,
  getDocumentHistory,
};
