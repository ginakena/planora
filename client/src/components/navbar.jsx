import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  AppBar, Toolbar, Typography, IconButton, Avatar,
  Box, Menu, MenuItem, Divider, Tooltip, Chip,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import WifiIcon from '@mui/icons-material/Wifi';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import { useAuth } from '../context/authContext';
import { useSocket } from '../context/socketContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { connected } = useSocket();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleLogout = () => {
    setAnchorEl(null);
    logout();
    navigate('/login');
  };

  return (
    <AppBar position="fixed" elevation={1} sx={{ bgcolor: 'background.paper', color: 'text.primary' }}>
      <Toolbar sx={{ gap: 1 }}>
        <Typography
          variant="h6"
          component={RouterLink}
          to="/dashboard"
          sx={{ fontWeight: 800, textDecoration: 'none', color: 'primary.main', mr: 2 }}
        >
          TaskFlow
        </Typography>

        <Tooltip title="Dashboard">
          <IconButton component={RouterLink} to="/dashboard" color="inherit" size="small">
            <DashboardIcon />
          </IconButton>
        </Tooltip>

        <Box sx={{ flex: 1 }} />

        {/* Real-time connection indicator */}
        <Tooltip title={connected ? 'Real-time connected' : 'Real-time disconnected'}>
          <Chip
            icon={connected ? <WifiIcon sx={{ fontSize: '14px !important' }} /> : <WifiOffIcon sx={{ fontSize: '14px !important' }} />}
            label={connected ? 'Live' : 'Offline'}
            size="small"
            color={connected ? 'success' : 'default'}
            variant="outlined"
            sx={{ fontSize: 11, height: 24 }}
          />
        </Tooltip>

        {/* Avatar menu */}
        <Tooltip title={user?.username}>
          <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ p: 0, ml: 1 }}>
            <Avatar src={user?.avatar} sx={{ width: 34, height: 34, bgcolor: 'primary.main', fontSize: 14 }}>
              {user?.username?.[0]?.toUpperCase()}
            </Avatar>
          </IconButton>
        </Tooltip>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <MenuItem disabled sx={{ fontSize: 13 }}>
            Signed in as <strong style={{ marginLeft: 4 }}>{user?.username}</strong>
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleLogout} sx={{ color: 'error.main', fontSize: 14 }}>
            Logout
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;