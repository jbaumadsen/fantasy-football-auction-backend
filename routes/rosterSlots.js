const express = require('express');
const router = express.Router();
const RosterSlot = require('../models/RosterSlot');

// Get all slots

router.get('/', async (req, res) => {
    try {
        const slots = await RosterSlot.find();
        res.json(slots);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/', async (req, res) => {
    console.log(req.body);
    const rosterSlot = new RosterSlot({
        position: req.body.position,
        budget: req.body.budget,
        filled: req.body.filled
    });

    try {
        const newRosterSlot = await rosterSlot.save();
        res.status(201).json(newRosterSlot);
        console.log(newRosterSlot);
    } catch (err) {
        res.status(400).json({ message: err.message });
        console.log(err);
    }
});

router.put('/:id', async (req, res) => {
    try {
        const updatedSlot = await RosterSlot.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedSlot);
    } catch (err) {
        console.log(err);
        res.status(400).json({ message: err.message });
    }
});

router.delete('/', async (req, res) => {
    try {
        await RosterSlot.findByIdAndDelete(req.params.id);
        res.json({ message: 'Roster slot deleted' });
        // log all players
        const players = await Player.find();
        console.log(players);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});


module.exports = router;
