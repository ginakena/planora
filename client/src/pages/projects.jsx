import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, CircularProgress, Alert, Paper,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  MenuItem, Select, FormControl, InputLabel, Avatar, AvatarGroup,
  Chip, Divider, Tooltip, IconButton,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import SettingsIcon from '@mui/icons-material/Settings';
import api from '../Api/api';
import { useAuth } from '../context/authContext';
import { useSocket } from '../context/socketContext';
import TaskCard from '../components/taskCard';
import TaskModal from '../components/TaskModal';

const COLUMNS = [
  { key: 'todo', label: 'To Do', color: '#1976d2' },
  { key: 'inprogress', label: 'In Progress', color: '#f57c00' },
  { key: 'done', label: 'Done', color: '#388e3c' },
];

const ProjectBoard = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { joinProject, leaveProject, on } = useSocket();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [board, setBoard] = useState({ todo: [], inprogress: [], done: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Task modal
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [taskModalOpen, setTaskModalOpen] = useState(false);

  // Create task dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [createColumn, setCreateColumn] = useState('todo');
  const [taskForm, setTaskForm] = useState({ title: '', description: '', priority: 'medium', assignee: '', dueDate: '' });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  // Add member dialog
  const [memberOpen, setMemberOpen] = useState(false);
  const [memberEmail, setMemberEmail] = useState('');
  const [addingMember, setAddingMember] = useState(false);
  const [memberError, setMemberError] = useState('');

  const isOwner = project?.owner?._id === user?._id;

  // All members for assignee dropdown (owner + members)
  const allMembers = project
    ? [{ user: project.owner }, ...project.members]
    : [];

  const fetchBoard = useCallback(async () => {
    try {
      const [projRes, tasksRes] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/projects/${id}/tasks`),
      ]);
      setProject(projRes.data.project);
      setBoard(tasksRes.data.board);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load project.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchBoard();
    joinProject(id);
    return () => leaveProject(id);
  }, [id, fetchBoard, joinProject, leaveProject]);

  // Real-time socket listeners
  useEffect(() => {
    const cleanups = [
      on('task:created', ({ task }) => {
        setBoard((prev) => ({
          ...prev,
          [task.status]: [...(prev[task.status] || []), task],
        }));
      }),
      on('task:updated', ({ task }) => {
        setBoard((prev) => {
          // Remove from all columns then add to correct one
          const next = {
            todo: prev.todo.filter((t) => t._id !== task._id),
            inprogress: prev.inprogress.filter((t) => t._id !== task._id),
            done: prev.done.filter((t) => t._id !== task._id),
          };
          next[task.status] = [...next[task.status], task];
          return next;
        });
      }),
      on('task:deleted', ({ taskId }) => {
        setBoard((prev) => ({
          todo: prev.todo.filter((t) => t._id !== taskId),
          inprogress: prev.inprogress.filter((t) => t._id !== taskId),
          done: prev.done.filter((t) => t._id !== taskId),
        }));
      }),
    ];
    return () => cleanups.forEach((fn) => fn?.());
  }, [on]);

  const handleCreateTask = async () => {
    if (!taskForm.title.trim()) return;
    setCreating(true);
    setCreateError('');
    try {
      await api.post(`/projects/${id}/tasks`, {
        ...taskForm,
        status: createColumn,
        assignee: taskForm.assignee || undefined,
        dueDate: taskForm.dueDate || undefined,
      });
      setCreateOpen(false);
      setTaskForm({ title: '', description: '', priority: 'medium', assignee: '', dueDate: '' });
    } catch (err) {
      setCreateError(err.response?.data?.message || 'Failed to create task.');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      // Socket will handle board update
    } catch (err) {
      console.error(err);
    }
  };

  const handleMoveTask = async (task, newStatus) => {
    try {
      await api.patch(`/tasks/${task._id}`, { status: newStatus });
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddMember = async () => {
    setAddingMember(true);
    setMemberError('');
    try {
      const { data } = await api.post(`/projects/${id}/members`, { email: memberEmail });
      setProject(data.project);
      setMemberEmail('');
      setMemberOpen(false);
    } catch (err) {
      setMemberError(err.response?.data?.message || 'Failed to add member.');
    } finally {
      setAddingMember(false);
    }
  };

  const openCreateTask = (column) => {
    setCreateColumn(column);
    setCreateOpen(true);
  };

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 12 }}><CircularProgress /></Box>
  );

  if (error) return (
    <Box sx={{ maxWidth: 600, mx: 'auto', pt: 12, px: 2 }}><Alert severity="error">{error}</Alert></Box>
  );

  return (
    <Box sx={{ pt: 9, pb: 4, px: 2, minHeight: '100vh', bgcolor: 'grey.50' }}>
      {/* Project header */}
      <Box sx={{ maxWidth: 1300, mx: 'auto', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <IconButton onClick={() => navigate('/dashboard')} size="small">
            <ArrowBackIcon />
          </IconButton>

          <Box sx={{ width: 14, height: 14, borderRadius: '50%', bgcolor: project?.color || 'primary.main' }} />
          <Typography variant="h6" fontWeight={800}>{project?.name}</Typography>

          {project?.description && (
            <Typography variant="body2" color="text.secondary">— {project.description}</Typography>
          )}

          <Box sx={{ flex: 1 }} />

          {/* Member avatars */}
          <AvatarGroup max={5} sx={{ '& .MuiAvatar-root': { width: 28, height: 28, fontSize: 12 } }}>
            {allMembers.map((m, i) => (
              <Tooltip key={i} title={m.user?.username}>
                <Avatar src={m.user?.avatar} sx={{ bgcolor: 'primary.main' }}>
                  {m.user?.username?.[0]?.toUpperCase()}
                </Avatar>
              </Tooltip>
            ))}
          </AvatarGroup>

          {isOwner && (
            <Tooltip title="Add member">
              <IconButton size="small" onClick={() => setMemberOpen(true)}>
                <PersonAddIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* Kanban board */}
      <Box sx={{ maxWidth: 1300, mx: 'auto', display: 'flex', gap: 2, alignItems: 'flex-start' }}>
        {COLUMNS.map((col) => (
          <Box key={col.key} sx={{ flex: 1, minWidth: 280 }}>
            <Paper elevation={0} sx={{
              bgcolor: 'grey.100', borderRadius: 3, p: 2,
              borderTop: `3px solid ${col.color}`,
            }}>
              {/* Column header */}
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle2" fontWeight={700}>{col.label}</Typography>
                <Chip
                  label={board[col.key]?.length || 0}
                  size="small"
                  sx={{ ml: 1, height: 20, fontSize: 11, bgcolor: col.color, color: 'white' }}
                />
                <Box sx={{ flex: 1 }} />
                <Tooltip title={`Add task to ${col.label}`}>
                  <IconButton size="small" onClick={() => openCreateTask(col.key)}>
                    <AddIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>

              {/* Tasks */}
              <Box sx={{ minHeight: 100 }}>
                {(board[col.key] || []).map((task) => (
                  <TaskCard
                    key={task._id}
                    task={task}
                    commentCount={0}
                    onClick={() => { setSelectedTaskId(task._id); setTaskModalOpen(true); }}
                    onDelete={handleDeleteTask}
                  />
                ))}
              </Box>

              {/* Move-to buttons shown on hover — quick status change */}
              <Button
                fullWidth
                size="small"
                startIcon={<AddIcon />}
                onClick={() => openCreateTask(col.key)}
                sx={{ mt: 1, borderRadius: 2, textTransform: 'none', color: 'text.secondary',
                  '&:hover': { bgcolor: 'grey.200' } }}
              >
                Add task
              </Button>
            </Paper>
          </Box>
        ))}
      </Box>

      {/* Task detail modal */}
      <TaskModal
        taskId={selectedTaskId}
        open={taskModalOpen}
        onClose={() => { setTaskModalOpen(false); setSelectedTaskId(null); }}
        members={allMembers}
        onTaskUpdated={(updatedTask) => {
          setBoard((prev) => {
            const next = {
              todo: prev.todo.filter((t) => t._id !== updatedTask._id),
              inprogress: prev.inprogress.filter((t) => t._id !== updatedTask._id),
              done: prev.done.filter((t) => t._id !== updatedTask._id),
            };
            next[updatedTask.status] = [...next[updatedTask.status], updatedTask];
            return next;
          });
        }}
      />

      {/* Create Task Dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle fontWeight={700}>
          New Task — <span style={{ color: COLUMNS.find((c) => c.key === createColumn)?.color }}>
            {COLUMNS.find((c) => c.key === createColumn)?.label}
          </span>
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          {createError && <Alert severity="error">{createError}</Alert>}
          <TextField label="Task Title" value={taskForm.title}
            onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
            fullWidth size="small" autoFocus required />
          <TextField label="Description (optional)" value={taskForm.description}
            onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
            fullWidth size="small" multiline rows={2} />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControl size="small" fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select value={taskForm.priority} label="Priority"
                onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}>
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" fullWidth>
              <InputLabel>Assignee</InputLabel>
              <Select value={taskForm.assignee} label="Assignee"
                onChange={(e) => setTaskForm({ ...taskForm, assignee: e.target.value })}>
                <MenuItem value="">Unassigned</MenuItem>
                {allMembers.map((m, i) => (
                  <MenuItem key={i} value={m.user?._id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar src={m.user?.avatar} sx={{ width: 22, height: 22, fontSize: 10 }}>
                        {m.user?.username?.[0]?.toUpperCase()}
                      </Avatar>
                      {m.user?.username}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          <TextField label="Due Date" type="date" size="small" fullWidth
            value={taskForm.dueDate}
            onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
            InputLabelProps={{ shrink: true }} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCreateOpen(false)} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateTask}
            disabled={creating || !taskForm.title.trim()}
            sx={{ textTransform: 'none', borderRadius: 2 }}>
            {creating ? <CircularProgress size={18} color="inherit" /> : 'Create Task'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Member Dialog */}
      <Dialog open={memberOpen} onClose={() => setMemberOpen(false)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle fontWeight={700}>Add Member</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          {memberError && <Alert severity="error" sx={{ mb: 2 }}>{memberError}</Alert>}
          <TextField
            label="Member's email address"
            type="email"
            value={memberEmail}
            onChange={(e) => setMemberEmail(e.target.value)}
            fullWidth size="small" autoFocus
            helperText="They must already have a TaskFlow account"
          />
          <Divider sx={{ my: 2 }} />
          <Typography variant="caption" color="text.secondary" display="block" mb={1}>
            Current members
          </Typography>
          {allMembers.map((m, i) => (
            <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
              <Avatar src={m.user?.avatar} sx={{ width: 28, height: 28, fontSize: 12 }}>
                {m.user?.username?.[0]?.toUpperCase()}
              </Avatar>
              <Typography variant="body2">{m.user?.username}</Typography>
              {i === 0 && <Chip label="Owner" size="small" color="primary" sx={{ fontSize: 10, height: 18 }} />}
            </Box>
          ))}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setMemberOpen(false)} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button variant="contained" onClick={handleAddMember}
            disabled={addingMember || !memberEmail.trim()}
            sx={{ textTransform: 'none', borderRadius: 2 }}>
            {addingMember ? <CircularProgress size={18} color="inherit" /> : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProjectBoard;