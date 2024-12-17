const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const path = require('path');

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// serve the React app from the build folder
app.use(express.static(path.join(__dirname, 'client/dist')));

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
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/dist/index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));