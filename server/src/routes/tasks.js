const express = require('express');
const router = express.Router();
const {
  createTask, getProjectTasks, getTask,
  updateTask, deleteTask, addComment, deleteComment,
} = require('../controllers/taskController');
const { protect } = require('../middleware/Auth');
const { isMember } = require('../middleware/projectAccess');


// POST   /api/projects/:projectId/tasks
router.post('/projects/:projectId/tasks', protect, isMember, createTask);

// GET    /api/projects/:projectId/tasks
router.get('/projects/:projectId/tasks', protect, isMember, getProjectTasks);

// GET    /api/tasks/:id
router.get('/tasks/:id', protect, getTask);

// PATCH  /api/tasks/:id
router.patch('/tasks/:id', protect, updateTask);

// DELETE /api/tasks/:id
router.delete('/tasks/:id', protect, deleteTask);

// POST   /api/tasks/:id/comments
router.post('/tasks/:id/comments', protect, addComment);

// DELETE /api/tasks/:id/comments/:commentId
router.delete('/tasks/:id/comments/:commentId', protect, deleteComment);

module.exports = router;