const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const errorHandler = require('./middleware/errorHandler');

const app = express();
const server = http.createServer(app);

// ── Socket.io setup 
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

// Attach io to every request so controllers can emit events
app.use((req, res, next) => {
  req.io = io;
  next();
});

io.on('connection', (socket) => {
  console.log(`[Socket] connected: ${socket.id}`);

  // Client joins a project room to receive real-time updates
  socket.on('join:project', (projectId) => {
    socket.join(projectId);
    console.log(`[Socket] ${socket.id} joined project ${projectId}`);
  });

  socket.on('leave:project', (projectId) => {
    socket.leave(projectId);
  });

  socket.on('disconnect', () => {
    console.log(`[Socket] disconnected: ${socket.id}`);
  });
});

// ── Express middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());


mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => { console.error('❌ MongoDB error:', err.message); process.exit(1); });


const taskRoutes = require('./routes/tasks');

app.use('/api/auth', require('./routes/auth'));
app.use('/api/projects', require('./routes/projects'));
// Task routes handle both /api/projects/:projectId/tasks and /api/tasks/:id
app.use('/api', taskRoutes);

app.get('/api/health', (req, res) => res.json({ success: true, message: 'Server running.' }));

app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` });
});

app.use(errorHandler);

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));