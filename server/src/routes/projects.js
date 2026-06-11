const express = require('express');
const router = express.Router();
const {
  createProject, getMyProjects, getProject,
  updateProject, deleteProject, addMember, removeMember,
} = require('../controllers/projectController');
const { protect } = require('../middleware/Auth');
const { isMember, isOwner } = require('../middleware/projectAccess');

// GET  /api/projects        
router.get('/', protect, getMyProjects);

// POST /api/projects         — create a project
router.post('/', protect, createProject);

// GET  /api/projects/:id     — single project (members only)
router.get('/:id', protect, isMember, getProject);

// PATCH /api/projects/:id    — update project (owner only)
router.patch('/:id', protect, isMember, isOwner, updateProject);

// DELETE /api/projects/:id   — delete project + all tasks (owner only)
router.delete('/:id', protect, isMember, isOwner, deleteProject);

// POST /api/projects/:id/members          — add member by email (owner only)
router.post('/:id/members', protect, isMember, isOwner, addMember);

// DELETE /api/projects/:id/members/:userId — remove member (owner only)
router.delete('/:id/members/:userId', protect, isMember, isOwner, removeMember);

module.exports = router;