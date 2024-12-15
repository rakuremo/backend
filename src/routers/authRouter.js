const authController = require("../controllers/authController.js")
const router = require('express').Router()
const authMiddleware = require('../middlerwares/authMiddleware')

router.post('/login', authController.login)
router.post('/check-token', authController.checkToken)
router.post('/register/admin', authController.registerAdmin)
router.post('/register',authController.register)


module.exports = router