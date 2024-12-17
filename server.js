const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
// const path = require('path');

// Middleware
app.use(cors());
app.use(express.json());

const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',')
  : [];

console.log(allowedOrigins);

// Define a CORS function to dynamically check allowed origins
const corsOptions = {
  origin: function (origin, callback) {
    // If no origin (e.g. server-to-server request), or origin is allowed
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

app.use(cors(corsOptions));

// configure cors
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true,
}));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// // serve the React app from the build folder
// app.use(express.static(path.join(__dirname, 'client/dist')));

// Routes
const playerRoutes = require('./routes/players');
app.use('/api/players', playerRoutes);
const rosterSlotRoutes = require('./routes/rosterSlots');
app.use('/api/rosterSlots', rosterSlotRoutes);
const teamMemberRoutes = require('./routes/teamMembers');
app.use('/api/teamMembers', teamMemberRoutes);
const budgetSlotRoutes = require('./routes/budgetSlots');
app.use('/api/budgetSlots', budgetSlotRoutes);

// serve the React app from the build folder
// app.get('*', (req, res) => {
//   res.sendFile(path.join(__dirname, 'client/dist/index.html'));
// });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));