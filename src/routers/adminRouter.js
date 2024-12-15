const adminController = require('../controllers/adminController');
const authMiddleware = require("../middlerwares/authMiddleware.js")
const router = require('express').Router();
const hardwareController = require("../controllers/hardwareController.js")
const userController = require("../controllers/userController");

router.post('/create-hardware', authMiddleware.isAmin, hardwareController.createHardware)

router.put('/update-hardware/:id', authMiddleware.isAmin, hardwareController.updateHardware)

router.post('/get-all-users',authMiddleware.isAmin, adminController.getAllUsers);

router.post('/get-all-hardwares', authMiddleware.isAmin,adminController.getAllHardware);

router.post('/ban-user', authMiddleware.isAmin,adminController.banUser);

router.post('/add-user-with-hardware', authMiddleware.isAmin,adminController.setUserWithHardware);

router.post('/delete-user-with-hardware/:id', authMiddleware.isAmin,adminController.updateUserWithHardware);

router.post('/add-hardware-with-user', authMiddleware.isAmin,adminController.addHardwareWithUser);

router.post('/delete-hardware-with/user/:id', authMiddleware.isAmin,adminController.deleteHardwareWithUser);

router.post ('/update-hardware-status',authMiddleware.authMiddleware, userController.updateHardwareStatus)

router.post('/create-user-set-param',authMiddleware.authMiddleware, userController.updateHardwareParam)

router.post('/get-one-user/:id',authMiddleware.isAmin, adminController.getOneUser);

router.post('/get-one-hardware/:id',authMiddleware.isAmin, adminController.getOneHardware);

router.post('/get-all-user-no-hardware',authMiddleware.isAmin, adminController.getUserNoHardware);

router.post('/get-all-hardware-no-user',authMiddleware.isAmin, adminController.getHardwareNoUser);

router.post('/get-user-by-username',authMiddleware.isAmin, userController.getUserByUserName);




module.exports = router;