const express = require('express');
const router = express.Router();
const Player = require('../models/Player');
const Backup = require('../models/Backup');
const mongoose = require('mongoose');

// Get all players
router.get('/', async (req, res) => {
  try {
    const players = await Player.find();
    res.json(players);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update a player
router.put('/:id', async (req, res) => {
  try {
    const updatedPlayer = await Player.findByIdAndUpdate(req.params.id, req.body, { new: true });
    console.log(updatedPlayer);
    res.json(updatedPlayer);
  } catch (err) {
    console.log(err);
    res.status(400).json({ message: err.message });
  }
});

// Update players from JSON
router.post('/updateFromJSON', async (req, res) => {
  try {
    console.log(req.body);
    const players = req.body;
    for (let player of players) {
      const existingPlayer = await Player.findOne({ name: player.name });
      if (existingPlayer) {
          // Preserve existing my$ and au$ values
          console.log('Player already exists');
        await Player.findOneAndUpdate(
            { _id: existingPlayer._id },
            { 
              ...player, 
              my$: existingPlayer.my$, 
              au$: existingPlayer.au$ 
            },
            { new: false }
        );
      } else {
        // For new players, set default values
        await Player.create({
          ...player,
          my$: 0,
          au$: null
        });
      }
    }
    res.status(200).json({ message: 'Players updated successfully' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// delete all players with my$ === 0
router.delete('/deleteWithMyZero', async (req, res) => {
  console.log('Deleting players with my$ === 0');
  try {
    await Player.deleteMany({ my$: 0 });
    res.status(200).json({ message: 'Players with my$ === 0 have been deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/eraseDraftValues', async (req, res) => {
  try {
    await Player.updateMany({}, { $set: { au$: null } });
    res.status(200).json({ message: 'All draft values have been erased successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/backup', async (req, res) => {
  try {
    const players = await Player.find();
    const backupName = req.body.name || `Backup_${new Date().toISOString()}`;
    
    const backup = new Backup({
      name: backupName,
      players: players
    });
    
    await backup.save();
    res.status(201).json({ message: 'Backup created successfully', backup });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/backups', async (req, res) => {
  try {
    const backups = await Backup.find().select('name timestamp');
    res.json(backups);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/backup/:id', async (req, res) => {
  try {
    const backup = await Backup.findById(req.params.id);
    if (!backup) {
      return res.status(404).json({ message: 'Backup not found' });
    }
    res.json(backup);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/restore', async (req, res) => {
  try {
    // Find the most recent backup
    const latestBackup = await Backup.findOne().sort({ timestamp: -1 });
    
    if (!latestBackup) {
      return res.status(404).json({ message: 'No backups found' });
    }

    const preserveValues = req.body.preserveValues || false;

    const session = await mongoose.startSession();
    await session.withTransaction(async () => {
      await Player.deleteMany({});

      for (let playerData of latestBackup.players) {
        if (preserveValues) {
          const existingPlayer = await Player.findOne({ name: playerData.name });
          if (existingPlayer) {
            playerData.my$ = existingPlayer.my$;
            playerData.au$ = existingPlayer.au$;
          }
        }
        await Player.create(playerData);
      }
    });

    await session.endSession();
    res.json({ 
      message: 'Restore completed successfully', 
      backupUsed: {
        id: latestBackup._id,
        name: latestBackup.name,
        timestamp: latestBackup.timestamp
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/restore/:id', async (req, res) => {
  try {
    const backup = await Backup.findById(req.params.id);
    if (!backup) {
      return res.status(404).json({ message: 'Backup not found' });
    }

    const preserveValues = req.body.preserveValues || false;

    const session = await mongoose.startSession();
    await session.withTransaction(async () => {
      await Player.deleteMany({});

      for (let playerData of backup.players) {
        if (preserveValues) {
          const existingPlayer = await Player.findOne({ name: playerData.name });
          if (existingPlayer) {
            playerData.my$ = existingPlayer.my$;
            playerData.au$ = existingPlayer.au$;
          }
        }
        await Player.create(playerData);
      }
    });

    await session.endSession();
    res.json({ message: 'Restore completed successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/backup/:id', async (req, res) => {
  try {
    const backup = await Backup.findByIdAndDelete(req.params.id);
    if (!backup) {
      return res.status(404).json({ message: 'Backup not found' });
    }
    res.json({ message: 'Backup deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;