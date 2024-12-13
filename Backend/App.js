require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const userRoutes = require('./Routes/User');
const bookRoutes = require('./Routes/Book');
const path = require('path');
const errorHandler = require('./Middleware/ErrorHandler');

const app = express();

const cors = require('cors');
app.use(cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));

// Middleware to parse incoming JSON requests
app.use(express.json());

// Routes for user authentication and books
app.use('/api/auth', userRoutes);
app.use('/api/books', bookRoutes);

// Serve static images
app.use('/images', express.static(path.join(__dirname, 'images')));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('Connexion à MongoDB réussie !'))
  .catch((error) => console.log('Connexion à MongoDB échouée !', error));

// Catch-all route for undefined routes (404 errors)
app.use((req, res, next) => {
  const error = new Error('Not Found');
  error.status = 404;
  next(error);
});

// Error handling middleware
app.use(errorHandler);

// Wrap the app in an async error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Une erreur est survenue sur le serveur'
  });
});

module.exports = app;