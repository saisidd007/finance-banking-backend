const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

router.post('/register', authController.registerUser);
router.post('/login',    authController.loginUser);
router.post('/logout',   authenticate, authController.logoutUser);


router.get('/users',authenticate, authorize('Admin'), authController.getAllUsers);
router.patch('/users/:id/toggle-status', authenticate, authorize('Admin'), authController.toggleUserStatus);

module.exports = router;

