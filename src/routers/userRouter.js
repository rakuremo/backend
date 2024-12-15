const userController = require('../controllers/userController')
const authMiddleware = require('../middlerwares/authMiddleware')
const hardwareController = require('../controllers/hardwareController')
const router = require('express').Router()

router.post('/get-user-hardware',authMiddleware.authMiddleware, userController.getUserHardware)

router.post ('/set-hardware-status',authMiddleware.authMiddleware, userController.updateHardwareStatus)

router.post('/set-param',authMiddleware.authMiddleware, userController.updateHardwareParam)

router.get('/get-hardware/with-camera-by/:id',authMiddleware.authMiddleware, hardwareController.getByHardwareWithCamare)

router.get('/get-hardware-status/:id',authMiddleware.authMiddleware, hardwareController.getHardwareStatusById)

router.post('/get-hardware/log-activity/:id',authMiddleware.authMiddleware, hardwareController.getLogUserActiveHardware)

router.get('/get-hardware/log/message/:id',authMiddleware.authMiddleware, hardwareController.get30message)

router.post('/get-hardware/param/byId',authMiddleware.authMiddleware, userController.getParamByHardwareId)

router.put('/hardware/update-param/:id',authMiddleware.authMiddleware, userController.updateParam)

router.delete('/delete/param/:id',authMiddleware.authMiddleware, userController.deleteParam)

router.post("/send-command/:id", authMiddleware.authMiddleware, userController.sendCommand)

module.exports = router