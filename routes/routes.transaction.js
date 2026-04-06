const express = require('express');
const router = express.Router();
const tc = require('../controllers/transaction.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

router.use(authenticate);

router.post('/',authorize('Admin'), tc.createTransaction);
router.get('/',authorize('Admin', 'Analyst', 'Viewer'), tc.getTransactions);
router.get('/:id',authorize('Admin', 'Analyst'), tc.getTransactionById);
router.put('/:id',authorize('Admin'), tc.updateTransaction);
router.delete('/:id',authorize('Admin'), tc.deleteTransaction);

module.exports = router;
