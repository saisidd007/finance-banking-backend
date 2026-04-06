const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

// All dashboard routes require authentication
router.use(authenticate);


const allRoles = authorize('Admin', 'Analyst', 'Viewer');

router.get('/summary',allRoles, dashboardController.getSummary);
router.get('/by-category',allRoles, dashboardController.getByCategory);
router.get('/monthly',allRoles, dashboardController.getMonthlyTrends);
router.get('/weekly',allRoles, dashboardController.getWeeklyTrends);
router.get('/recent',allRoles, dashboardController.getRecentActivity);
router.get('/top-categories',allRoles, dashboardController.getTopCategories);

module.exports = router;
