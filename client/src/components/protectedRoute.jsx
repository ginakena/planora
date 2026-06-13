import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/authContext';
import { Box, CircularProgress } from '@mui/material';

const protectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;
  return user ? children : <Navigate to="/login" replace />;
};

export default protectedRoute;