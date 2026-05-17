require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const teacherRoutes = require('./routes/teacher');
const workshopRoutes = require('./routes/workshop');
const registrationRoutes = require('./routes/registration');
const reminderRoutes = require('./routes/reminder');
const feedbackRoutes = require('./routes/feedback');
const certificateRoutes = require('./routes/certificate');

const { handleError } = require('./utils/errors');

const app = express();

// Security
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { success: false, message: 'Too many requests, slow down.' }
});
app.use(limiter);

// Health check (no auth needed)
app.get('/', (req, res) => {
  res.json({ success: true, message: 'WorkshopFlow API is running.' });
});

// Routes
app.use('/api/teacher', teacherRoutes);
app.use('/api/workshop', workshopRoutes);
app.use('/api/register', registrationRoutes);
app.use('/api/reminder', reminderRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/certificate', certificateRoutes);

// Global error handler
app.use((err, req, res, next) => {
  handleError(err, res);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`WorkshopFlow API running on port ${PORT}`);
});
