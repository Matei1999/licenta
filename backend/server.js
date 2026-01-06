const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { connectDB } = require('./config/database');
const seedDefaultUser = require('./seedDefaultUser');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from React build in production
const buildPath = path.join(__dirname, '../frontend/build');
app.use(express.static(buildPath));

// Database connection and seed default user
connectDB().then(async () => {
  console.log('✅ Database connection successful');
  await seedDefaultUser();
}).catch(err => {
  console.error('❌ Database connection error:', err.message);
  process.exit(1);
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/patients', require('./routes/patients'));
app.use('/api/sleep-data', require('./routes/sleepData'));
app.use('/api/visits', require('./routes/visits'));
app.use('/api/audit-logs', require('./routes/auditLogs'));
app.use('/api/export', require('./routes/export'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Serve React app for all non-API routes (client-side routing)
app.get('*', (req, res) => {
  res.sendFile(path.join(buildPath, 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server is running on port ${PORT}`);
});
