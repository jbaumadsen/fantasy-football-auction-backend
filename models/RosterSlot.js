const mongoose = require('mongoose');

const RosterSlotSchema = new mongoose.Schema({
  position: { type: String, required: true },
  budget: { type: Number, required: false },
  filled: { type: Boolean, required: true },
});

module.exports = mongoose.model('RosterSlot', RosterSlotSchema);