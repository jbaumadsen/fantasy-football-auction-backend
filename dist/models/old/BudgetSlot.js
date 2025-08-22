"use strict";
const mongoose = require('mongoose');
const BudgetSlotSchema = new mongoose.Schema({
    position: { type: String, required: true },
    budget: { type: Number, required: false },
    filled: { type: Boolean, required: true },
});
module.exports = mongoose.model('BudgetSlot', BudgetSlotSchema);
//# sourceMappingURL=BudgetSlot.js.map