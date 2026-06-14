import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Grid, Card, CardContent, CardActionArea,
  Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, CircularProgress, Alert, Chip, LinearProgress,
  IconButton, Tooltip, Avatar,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from "@mui/icons-material/Delete";
import GroupIcon from '@mui/icons-material/Group';
import api from '../Api/api';
import { useAuth } from '../context/authContext';

const COLOR_OPTIONS = ['#1976d2', '#9c27b0', '#e91e63', '#f44336', '#ff9800', '#4caf50', '#009688'];

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Create dialog
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', color: '#1976d2' });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  useEffect(() => {
    api.get('/projects')
      .then(({ data }) => setProjects(data.projects))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load projects.'))
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    setCreating(true);
    setCreateError('');
    try {
      const { data } = await api.post('/projects', form);
      setProjects((prev) => [{ ...data.project, taskCount: 0, doneCount: 0 }, ...prev]);
      setOpen(false);
      setForm({ name: '', description: '', color: '#1976d2' });
    } catch (err) {
      setCreateError(err.response?.data?.message || 'Failed to create project.');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (e, projectId) => {
    e.stopPropagation();
    if (!window.confirm('Delete this project and all its tasks?')) return;
    try {
      await api.delete(`/projects/${projectId}`);
      setProjects((prev) => prev.filter((p) => p._id !== projectId));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto', px: 3, pt: 10, pb: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h5" fontWeight={800}>My Projects</Typography>
          <Typography variant="body2" color="text.secondary">
            Welcome back, {user?.username}
          </Typography>
        </Box>
        <Box sx={{ flex: 1 }} />
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpen(true)}
          sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 600 }}
        >
          New Project
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : projects.length === 0 ? (
        <Box sx={{ textAlign: 'center', mt: 10 }}>
          <Typography variant="h6" color="text.secondary" mb={1}>No projects yet</Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Create your first project to get started
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}
            sx={{ borderRadius: 3, textTransform: 'none' }}>
            Create Project
          </Button>
        </Box>
      ) : (
        <Grid container spacing={2.5}>
          {projects.map((project) => {
            const progress = project.taskCount > 0
              ? Math.round((project.doneCount / project.taskCount) * 100) : 0;
            const isOwner = project.owner?._id === user?._id || project.owner === user?._id;

            return (
              <Grid item xs={12} sm={6} md={4} key={project._id}>
                <Card elevation={1} sx={{ borderRadius: 3, height: '100%', position: 'relative',
                  borderTop: `4px solid ${project.color || '#1976d2'}`,
                  transition: 'box-shadow 0.2s', '&:hover': { boxShadow: 4 } }}>

                  {isOwner && (
                    <Tooltip title="Delete project">
                      <IconButton
                        size="small"
                        onClick={(e) => handleDelete(e, project._id)}
                        sx={{ position: 'absolute', top: 8, right: 8, color: 'text.secondary',
                          '&:hover': { color: 'error.main' } }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}

                  <CardActionArea onClick={() => navigate(`/projects/${project._id}`)}
                    sx={{ height: '100%', alignItems: 'flex-start', p: 0 }}>
                    <CardContent sx={{ pb: '16px !important' }}>
                      <Typography variant="subtitle1" fontWeight={700} mb={0.5} pr={3}>
                        {project.name}
                      </Typography>
                      {project.description && (
                        <Typography variant="caption" color="text.secondary"
                          sx={{ display: '-webkit-box', WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical', overflow: 'hidden', mb: 1.5 }}>
                          {project.description}
                        </Typography>
                      )}

                      {/* Progress bar */}
                      <Box sx={{ mb: 1.5 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="caption" color="text.secondary">Progress</Typography>
                          <Typography variant="caption" fontWeight={600}>{progress}%</Typography>
                        </Box>
                        <LinearProgress variant="determinate" value={progress}
                          sx={{ borderRadius: 4, height: 5,
                            '& .MuiLinearProgress-bar': { bgcolor: project.color || 'primary.main' } }} />
                      </Box>

                      {/* Footer */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip label={`${project.taskCount} tasks`} size="small" variant="outlined"
                          sx={{ fontSize: 11, height: 22 }} />
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 'auto' }}>
                          <GroupIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                          <Typography variant="caption" color="text.secondary">
                            {(project.members?.length || 0) + 1}
                          </Typography>
                        </Box>
                        {!isOwner && (
                          <Chip label="Member" size="small" color="primary" variant="outlined"
                            sx={{ fontSize: 10, height: 20 }} />
                        )}
                      </Box>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Create Project Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle fontWeight={700}>New Project</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          {createError && <Alert severity="error">{createError}</Alert>}
          <TextField
            label="Project Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            fullWidth size="small" autoFocus required
            inputProps={{ maxLength: 100 }}
          />
          <TextField
            label="Description (optional)"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            fullWidth size="small" multiline rows={2}
            inputProps={{ maxLength: 500 }}
          />
          <Box>
            <Typography variant="caption" color="text.secondary" mb={1} display="block">
              Project color
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {COLOR_OPTIONS.map((c) => (
                <Box key={c} onClick={() => setForm({ ...form, color: c })}
                  sx={{ width: 28, height: 28, borderRadius: '50%', bgcolor: c, cursor: 'pointer',
                    border: form.color === c ? '3px solid #333' : '2px solid transparent',
                    transition: 'border 0.15s' }} />
              ))}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpen(false)} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={creating || !form.name.trim()}
            sx={{ textTransform: 'none', borderRadius: 2 }}>
            {creating ? <CircularProgress size={18} color="inherit" /> : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Dashboard;