"use strict";
const mongoose = require('mongoose');
const TeamMemberSchema = new mongoose.Schema({
    playerId: { type: String, required: true },
});
module.exports = mongoose.model('TeamMember', TeamMemberSchema);
//# sourceMappingURL=TeamMember.js.map