const mongoose = require('mongoose');

const PlayerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  team: { type: String, required: true },
  position: { type: String, required: true },
  rank: { type: Number, required: true },
  avgCost: { type: Number, required: true },
  projCost: { type: Number, required: true },
  my$: { type: Number, default: 0 },
  au$: { type: Number, default: null },
  fantasyManagerId: { type: String, default: null }
});

module.exports = mongoose.model('Player', PlayerSchema);