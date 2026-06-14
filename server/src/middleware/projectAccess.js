const Project = require('../models/project');

// Attach project to req.project and verify membership
const isMember = async (req, res, next) => {
  try {
    
    const projectId = req.params.id || req.params.projectId || req.body.projectId;
    const project = await Project.findById(projectId)
      .populate('owner', 'username avatar email')
      .populate('members.user', 'username avatar email');

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    const userId = req.user._id.toString();
    const isOwner = project.owner._id.toString() === userId;
    const isMemberOfProject = project.members.some((m) => m.user._id.toString() === userId);

    if (!isOwner && !isMemberOfProject) {
      return res.status(403).json({ success: false, message: 'Access denied. Not a project member.' });
    }

    req.project = project;
    req.isOwner = isOwner;
    next();
  } catch (err) {
    next(err);
  }
};

// Only the project owner can perform this action
const isOwner = (req, res, next) => {
  if (!req.isOwner) {
    return res.status(403).json({ success: false, message: 'Only the project owner can do this.' });
  }
  next();
};

module.exports = { isMember, isOwner };