const Project = require('../models/project');
const Task = require('../models/task');
const User = require('../models/user');

// POST /api/projects
const createProject = async (req, res, next) => {
  try {
    const { name, description, color } = req.body;
    const project = await Project.create({
      name,
      description,
      color: color || '#1976d2',
      owner: req.user._id,
      members: [],
    });
    await project.populate('owner', 'username avatar email');
    res.status(201).json({ success: true, project });
  } catch (err) {
    next(err);
  }
};

// GET /api/projects — all projects where user is owner or member
const getMyProjects = async (req, res, next) => {
  try {
    const projects = await Project.find({
      $or: [{ owner: req.user._id }, { 'members.user': req.user._id }],
    })
      .populate('owner', 'username avatar')
      .populate('members.user', 'username avatar')
      .sort({ updatedAt: -1 });

    // Attach task counts
    const projectsWithCounts = await Promise.all(
      projects.map(async (p) => {
        const taskCount = await Task.countDocuments({ project: p._id });
        const doneCount = await Task.countDocuments({ project: p._id, status: 'done' });
        return { ...p.toObject(), taskCount, doneCount };
      })
    );

    res.status(200).json({ success: true, projects: projectsWithCounts });
  } catch (err) {
    next(err);
  }
};

// GET /api/projects/:id — single project with members
const getProject = async (req, res, next) => {
  try {
    // req.project is already attached and verified by isMember middleware
    res.status(200).json({ success: true, project: req.project });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/projects/:id
const updateProject = async (req, res, next) => {
  try {
    const { name, description, color } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (color !== undefined) updates.color = color;

    const project = await Project.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    })
      .populate('owner', 'username avatar email')
      .populate('members.user', 'username avatar email');

    res.status(200).json({ success: true, project });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/projects/:id — owner only
const deleteProject = async (req, res, next) => {
  try {
    await Task.deleteMany({ project: req.params.id });
    await Project.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Project deleted.' });
  } catch (err) {
    next(err);
  }
};

// POST /api/projects/:id/members — add a member by email
const addMember = async (req, res, next) => {
  try {
    const { email, role } = req.body;
    if (!email)
      return res.status(400).json({ success: false, message: 'Email is required.' });

    const userToAdd = await User.findOne({ email: email.toLowerCase() });
    if (!userToAdd)
      return res.status(404).json({ success: false, message: 'No user found with that email.' });

    const project = req.project;
    const alreadyMember = project.members.some(
      (m) => m.user._id.toString() === userToAdd._id.toString()
    );
    const isOwner = project.owner._id.toString() === userToAdd._id.toString();

    if (alreadyMember || isOwner)
      return res.status(400).json({ success: false, message: 'User is already in this project.' });

    project.members.push({ user: userToAdd._id, role: role || 'member' });
    await project.save();
    await project.populate('members.user', 'username avatar email');

    res.status(200).json({ success: true, project });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/projects/:id/members/:userId — remove a member
const removeMember = async (req, res, next) => {
  try {
    const project = req.project;
    project.members = project.members.filter(
      (m) => m.user._id.toString() !== req.params.userId
    );
    await project.save();
    res.status(200).json({ success: true, message: 'Member removed.' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createProject,
  getMyProjects,
  getProject,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
};