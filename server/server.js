const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Basic health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running', timestamp: new Date() });
});

// Import routes
const apiRoutes = require('./src/routes/api');
const setupCron = require('./src/services/cronService');

app.use('/api', apiRoutes);

// Initialize Cron
setupCron();

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
