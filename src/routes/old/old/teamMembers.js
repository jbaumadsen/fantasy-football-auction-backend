const express = require('express');
const router = express.Router();
const TeamMember = require('../../../models/old/TeamMember');

// Get all slots

router.get('/', async (req, res) => {
    try {
        const teamMembers = await TeamMember.find();
        res.json(teamMembers);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/', async (req, res) => {
  try {
    const teamMember = new TeamMember({
        playerId: req.body.playerId,
    });
    await teamMember.save();

    const updatedTeam = await TeamMember.find();
    res.json(updatedTeam);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/:id', async (req, res) => {
    try {
        const updatedTeamMember = await TeamMember.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedTeamMember);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.delete('/', async (req, res) => {
    try {
        await TeamMember.deleteOne({ playerId: req.body.playerId });
        const updatedTeam = await TeamMember.find();
        res.json(updatedTeam);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});


module.exports = router;
