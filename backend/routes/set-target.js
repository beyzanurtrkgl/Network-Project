const express = require('express');
const router = express.Router();
const User = require('../model/user');
const verifyToken = require('../middleware/auth');

router.post('/set-target', verifyToken, async (req, res) => {
  const { currency, targetPrice } = req.body;
  const userId = req.user.user_id;

  try {
    const user = await User.findById(userId);
    const existingTargetIndex = user.targets.findIndex(target => target.currency === currency);

    if (existingTargetIndex !== -1) {
      // Eğer aynı döviz kuru varsa, hedef fiyatı güncelleyin
      user.targets[existingTargetIndex].targetPrice = targetPrice;
    } else {
      // Yeni bir döviz kuru hedefi ekleyin
      user.targets.push({ currency, targetPrice });
    }

    await user.save();
    res.send('Target price set successfully');
  } catch (error) {
    console.error('Error setting target price:', error);
    res.status(500).send('Error setting target price');
  }
});

module.exports = router;