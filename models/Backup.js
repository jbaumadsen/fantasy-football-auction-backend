const mongoose = require('mongoose');

const BackupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  players: [{
    name: { type: String, required: true },
    team: { type: String, required: true },
    position: { type: String, required: true },
    rank: { type: Number, required: true },
    avgCost: { type: Number, required: true },
    projCost: { type: Number, required: true },
    my$: { type: Number },
    au$: { type: Number }
  }]
});

module.exports = mongoose.model('Backup', BackupSchema);