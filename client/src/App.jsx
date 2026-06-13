import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CssBaseline, ThemeProvider, createTheme, Box } from '@mui/material';
import { AuthProvider, useAuth } from './context/authContext';
import { SocketProvider } from './context/socketContext';
import ProtectedRoute from './components/protectedRoute';
import Navbar from './components/navbar';
import Login from './pages/login';
import Register from './pages/register';
import Dashboard from './pages/dashboard';
import ProjectBoard from './pages/projects';

const theme = createTheme({
  palette: {
    primary: { main: '#1976d2' },
    background: { default: '#f5f6fa' },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", sans-serif',
  },
});

const Layout = ({ children }) => (
  <>
    <Navbar />
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      {children}
    </Box>
  </>
);

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/dashboard" replace /> : children;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
    <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
    <Route path="/dashboard" element={
      <ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>
    } />
    <Route path="/projects/:id" element={
      <ProtectedRoute><Layout><ProjectBoard /></Layout></ProtectedRoute>
    } />
    <Route path="/" element={<Navigate to="/dashboard" replace />} />
    <Route path="*" element={<Navigate to="/dashboard" replace />} />
  </Routes>
);

const App = () => (
  <ThemeProvider theme={theme}>
    <CssBaseline />
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <AppRoutes />
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  </ThemeProvider>
);

export default App;