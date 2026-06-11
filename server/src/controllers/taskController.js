const Task = require('../models/task');
const Comment = require('../models/comment');

// POST /api/projects/:projectId/tasks
const createTask = async (req, res, next) => {
  try {
    const { title, description, status, priority, assignee, dueDate } = req.body;

    const task = await Task.create({
      title,
      description,
      status: status || 'todo',
      priority: priority || 'medium',
      project: req.params.projectId,
      assignee: assignee || null,
      createdBy: req.user._id,
      dueDate: dueDate || null,
    });

    await task.populate('assignee', 'username avatar');
    await task.populate('createdBy', 'username avatar');

    // Emit real-time event
    req.io?.to(req.params.projectId).emit('task:created', { task });

    res.status(201).json({ success: true, task });
  } catch (err) {
    next(err);
  }
};

// GET /api/projects/:projectId/tasks — all tasks for a project grouped by status
const getProjectTasks = async (req, res, next) => {
  try {
    const tasks = await Task.find({ project: req.params.projectId })
      .populate('assignee', 'username avatar')
      .populate('createdBy', 'username avatar')
      .sort({ order: 1, createdAt: 1 });

    // Group into kanban columns
    const board = {
      todo: tasks.filter((t) => t.status === 'todo'),
      inprogress: tasks.filter((t) => t.status === 'inprogress'),
      done: tasks.filter((t) => t.status === 'done'),
    };

    res.status(200).json({ success: true, tasks, board });
  } catch (err) {
    next(err);
  }
};

// GET /api/tasks/:id — single task with comments
const getTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignee', 'username avatar email')
      .populate('createdBy', 'username avatar');

    if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });

    const comments = await Comment.find({ task: task._id })
      .populate('author', 'username avatar')
      .sort({ createdAt: 1 });

    res.status(200).json({ success: true, task, comments });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/tasks/:id — update task (status, assignee, title, etc.)
const updateTask = async (req, res, next) => {
  try {
    const allowed = ['title', 'description', 'status', 'priority', 'assignee', 'dueDate', 'order'];
    const updates = {};
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const task = await Task.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    })
      .populate('assignee', 'username avatar')
      .populate('createdBy', 'username avatar');

    if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });

    // Emit real-time event to all project members
    req.io?.to(task.project.toString()).emit('task:updated', { task });

    res.status(200).json({ success: true, task });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/tasks/:id
const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });

    await Comment.deleteMany({ task: task._id });
    await task.deleteOne();

    req.io?.to(task.project.toString()).emit('task:deleted', { taskId: task._id });

    res.status(200).json({ success: true, message: 'Task deleted.' });
  } catch (err) {
    next(err);
  }
};

// POST /api/tasks/:id/comments
const addComment = async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text?.trim())
      return res.status(400).json({ success: false, message: 'Comment text is required.' });

    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });

    const comment = await Comment.create({ text, author: req.user._id, task: task._id });
    await comment.populate('author', 'username avatar');

    req.io?.to(task.project.toString()).emit('comment:added', { taskId: task._id, comment });

    res.status(201).json({ success: true, comment });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/tasks/:id/comments/:commentId
const deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found.' });

    if (comment.author.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Not authorized.' });

    await comment.deleteOne();
    res.status(200).json({ success: true, message: 'Comment deleted.' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createTask,
  getProjectTasks,
  getTask,
  updateTask,
  deleteTask,
  addComment,
  deleteComment,
};