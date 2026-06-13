import { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, Box, Typography, TextField,
  Button, Avatar, Chip, IconButton, Divider, MenuItem, Select,
  FormControl, InputLabel, CircularProgress, Tooltip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from "@mui/icons-material/Delete";
import FlagIcon from '@mui/icons-material/Flag';
import { format } from 'date-fns';
import api from '../Api/api';
import { useAuth } from '../context/authContext';

const STATUS_OPTIONS = [
  { value: 'todo', label: 'To Do' },
  { value: 'inprogress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low', color: 'success' },
  { value: 'medium', label: 'Medium', color: 'warning' },
  { value: 'high', label: 'High', color: 'error' },
];

const PRIORITY_COLOR = { low: 'success', medium: 'warning', high: 'error' };

const TaskModal = ({ taskId, open, onClose, members = [], onTaskUpdated }) => {
  const { user } = useAuth();
  const [task, setTask] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [saving, setSaving] = useState(false);

  // Editable fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('todo');
  const [priority, setPriority] = useState('medium');
  const [assigneeId, setAssigneeId] = useState('');
  const [dueDate, setDueDate] = useState('');

  useEffect(() => {
    if (!taskId || !open) return;
    setLoading(true);
    api.get(`/tasks/${taskId}`)
      .then(({ data }) => {
        setTask(data.task);
        setComments(data.comments);
        setTitle(data.task.title);
        setDescription(data.task.description || '');
        setStatus(data.task.status);
        setPriority(data.task.priority);
        setAssigneeId(data.task.assignee?._id || '');
        setDueDate(data.task.dueDate ? format(new Date(data.task.dueDate), 'yyyy-MM-dd') : '');
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [taskId, open]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await api.patch(`/tasks/${taskId}`, {
        title, description, status, priority,
        assignee: assigneeId || null,
        dueDate: dueDate || null,
      });
      setTask(data.task);
      onTaskUpdated?.(data.task);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    setSubmitting(true);
    try {
      const { data } = await api.post(`/tasks/${taskId}/comments`, { text: commentText });
      setComments((prev) => [...prev, data.comment]);
      setCommentText('');
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await api.delete(`/tasks/${taskId}/comments/${commentId}`);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth
      PaperProps={{ sx: { borderRadius: 3, maxHeight: '90vh' } }}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', pb: 1 }}>
        <Typography fontWeight={700} flex={1}>Task Details</Typography>
        <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 0 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ display: 'flex', height: '100%', minHeight: 480 }}>
            {/* Left: main task details */}
            <Box sx={{ flex: 1, p: 3, overflowY: 'auto' }}>
              <TextField
                fullWidth
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                variant="standard"
                inputProps={{ style: { fontWeight: 700, fontSize: 18 } }}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                multiline
                minRows={3}
                maxRows={8}
                placeholder="Add a description..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                size="small"
                sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />

              <Button
                variant="contained"
                size="small"
                onClick={handleSave}
                disabled={saving}
                sx={{ borderRadius: 2, textTransform: 'none', mb: 3 }}
              >
                {saving ? <CircularProgress size={16} color="inherit" /> : 'Save changes'}
              </Button>

              <Divider sx={{ mb: 2 }} />

              {/* Comments */}
              <Typography variant="subtitle2" fontWeight={700} mb={1.5}>
                Comments ({comments.length})
              </Typography>

              {comments.length === 0 && (
                <Typography variant="caption" color="text.secondary">No comments yet.</Typography>
              )}

              {comments.map((c) => (
                <Box key={c._id} sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
                  <Avatar src={c.author?.avatar} sx={{ width: 30, height: 30, fontSize: 12, bgcolor: 'primary.main' }}>
                    {c.author?.username?.[0]?.toUpperCase()}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="caption" fontWeight={700}>{c.author?.username}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {format(new Date(c.createdAt), 'MMM d, h:mm a')}
                      </Typography>
                      {c.author?._id === user?._id && (
                        <Tooltip title="Delete comment">
                          <IconButton size="small" onClick={() => handleDeleteComment(c._id)} sx={{ p: 0.2 }}>
                            <DeleteOutlineIcon sx={{ fontSize: 13 }} />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                    <Box sx={{ bgcolor: 'grey.100', borderRadius: 2, px: 1.5, py: 0.75, mt: 0.3 }}>
                      <Typography variant="body2" sx={{ fontSize: 13 }}>{c.text}</Typography>
                    </Box>
                  </Box>
                </Box>
              ))}

              {/* Add comment */}
              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                <Avatar src={user?.avatar} sx={{ width: 30, height: 30, fontSize: 12, bgcolor: 'primary.main' }}>
                  {user?.username?.[0]?.toUpperCase()}
                </Avatar>
                <TextField
                  size="small"
                  fullWidth
                  placeholder="Write a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleAddComment()}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                />
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleAddComment}
                  disabled={submitting || !commentText.trim()}
                  sx={{ borderRadius: 2, textTransform: 'none', whiteSpace: 'nowrap' }}
                >
                  Add
                </Button>
              </Box>
            </Box>

            {/* Right: metadata sidebar */}
            <Box sx={{
              width: 220, bgcolor: 'grey.50', p: 2.5, borderLeft: '1px solid',
              borderColor: 'divider', display: 'flex', flexDirection: 'column', gap: 2.5,
            }}>
              <FormControl size="small" fullWidth>
                <InputLabel>Status</InputLabel>
                <Select value={status} label="Status" onChange={(e) => setStatus(e.target.value)}>
                  {STATUS_OPTIONS.map((s) => (
                    <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={priority}
                  label="Priority"
                  onChange={(e) => setPriority(e.target.value)}
                  renderValue={(v) => (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <FlagIcon sx={{ fontSize: 14, color: `${PRIORITY_COLOR[v]}.main` }} />
                      {PRIORITY_OPTIONS.find((p) => p.value === v)?.label}
                    </Box>
                  )}
                >
                  {PRIORITY_OPTIONS.map((p) => (
                    <MenuItem key={p.value} value={p.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <FlagIcon sx={{ fontSize: 14, color: `${p.color}.main` }} />
                        {p.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" fullWidth>
                <InputLabel>Assignee</InputLabel>
                <Select value={assigneeId} label="Assignee" onChange={(e) => setAssigneeId(e.target.value)}>
                  <MenuItem value="">Unassigned</MenuItem>
                  {members.map((m) => (
                    <MenuItem key={m.user?._id || m._id} value={m.user?._id || m._id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar src={m.user?.avatar || m.avatar} sx={{ width: 22, height: 22, fontSize: 10 }}>
                          {(m.user?.username || m.username)?.[0]?.toUpperCase()}
                        </Avatar>
                        {m.user?.username || m.username}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="Due Date"
                type="date"
                size="small"
                fullWidth
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />

              <Divider />

              <Box>
                <Typography variant="caption" color="text.secondary">Created by</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                  <Avatar src={task?.createdBy?.avatar} sx={{ width: 22, height: 22, fontSize: 10 }}>
                    {task?.createdBy?.username?.[0]?.toUpperCase()}
                  </Avatar>
                  <Typography variant="caption">{task?.createdBy?.username}</Typography>
                </Box>
              </Box>

              {task?.createdAt && (
                <Box>
                  <Typography variant="caption" color="text.secondary">Created</Typography>
                  <Typography variant="caption" display="block">
                    {format(new Date(task.createdAt), 'MMM d, yyyy')}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TaskModal;