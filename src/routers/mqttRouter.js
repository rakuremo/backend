const express = require('express');
const router = express.Router();
const mqttController = require('../controllers/mqttController');
const authMiddleware = require('../middlerwares/authMiddleware')

router.get('/status', authMiddleware.authMiddleware, mqttController.checkConnection);
router.post('/restart', authMiddleware.authMiddleware, mqttController.resStartConnection);
module.exports = router;
