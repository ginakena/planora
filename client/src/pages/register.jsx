import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box, Card, CardContent, TextField, Button, Typography,
  Link, Alert, CircularProgress,
} from '@mui/material';
import api from '../Api/api';
import { useAuth } from '../context/authContext';

const Register = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', form);
      login(data.token, data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.50', px: 2 }}>
      <Card elevation={2} sx={{ width: '100%', maxWidth: 400, borderRadius: 4 }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography variant="h5" fontWeight={800} color="primary">TaskFlow</Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>Create your account</Typography>
          </Box>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField label="Username" name="username" value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })} required fullWidth size="small" autoFocus />
            <TextField label="Email" name="email" type="email" value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })} required fullWidth size="small" />
            <TextField label="Password" name="password" type="password" value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })} required fullWidth size="small" />
            <Button type="submit" variant="contained" fullWidth disabled={loading}
              sx={{ borderRadius: 3, textTransform: 'none', py: 1.2, fontWeight: 600 }}>
              {loading ? <CircularProgress size={22} color="inherit" /> : 'Create Account'}
            </Button>
          </Box>
          <Typography variant="body2" textAlign="center" mt={2} color="text.secondary">
            Already have an account?{' '}
            <Link component={RouterLink} to="/login" fontWeight={600}>Sign in</Link>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Register;