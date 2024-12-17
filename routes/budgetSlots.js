const express = require('express');
const router = express.Router();
const BudgetSlot = require('../models/BudgetSlot');

// Get all slots

router.get('/', async (req, res) => {
    try {
        const slots = await BudgetSlot.find();
        res.json(slots);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/', async (req, res) => {
    console.log(req.body);
    const budgetSlot = new BudgetSlot({
        position: req.body.position,
        budget: req.body.budget,
        filled: req.body.filled
    });
    
    try {
        const newBudgetSlot = await budgetSlot.save();
        res.status(201).json(newBudgetSlot);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const updatedSlot = await BudgetSlot.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedSlot);
    } catch (err) {
        console.log(err);
        res.status(400).json({ message: err.message });
    }
});

router.delete('/', async (req, res) => {
    try {
        await BudgetSlot.findByIdAndDelete(req.params.id);
        res.json({ message: 'Budget slot deleted' });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});


module.exports = router;
