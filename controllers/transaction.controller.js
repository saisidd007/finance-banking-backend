const transactionModel = require('../models/transaction.model');


// create a Transaction
async function createTransaction(req, res) {
    try {
        const { amount, type, date, category, notes } = req.body;

        if (!amount || !type || !date || !category) {
            return res.status(400).json({ message: 'Missing fields' });
        }

        const transaction = await transactionModel.create({
            amount,
            type,
            date,
            category,
            notes: notes || '',
            user: req.user.id
        });

        res.status(201).json(transaction);

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}


//get all transactions
async function getTransactions(req, res) {
    try {
        const { type, category } = req.query;

        const filter = { isDeleted: false };

        if (req.user.role === 'Viewer') {
            res.status(409).json({
                message :  "You dont have access to view transaction data "
            })
        }

        if (type) filter.type = type;
        if (category) filter.category = category;

        const transactions = await transactionModel
            .find(filter)
            .sort({ date: -1 });

        res.json(transactions);

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}


// ─get a specific transaction by its id
async function getTransactionById(req, res) {
    try {
        const transaction = await transactionModel.findById(req.params.id);

        if (!transaction || transaction.isDeleted) {
            return res.status(404).json({ message: 'Not found' });
        }

        if (req.user.role === 'Viewer' && transaction.user.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Access denied' });
        }

        res.json(transaction);

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}


// update a transaction
async function updateTransaction(req, res) {
    try {
        const transaction = await transactionModel.findById(req.params.id);

        if (!transaction || transaction.isDeleted) {
            return res.status(404).json({ message: 'Not found' });
        }

        if (req.user.role === 'Viewer') {
            return res.status(403).json({ message: 'No permission' });
        }

        Object.assign(transaction, req.body);

        await transaction.save();

        res.json(transaction);

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}


// delete
async function deleteTransaction(req, res) {
    try {
        const transaction = await transactionModel.findById(req.params.id);

        if (!transaction || transaction.isDeleted) {
            return res.status(404).json({ message: 'Not found' });
        }

        transaction.isDeleted = true;
        await transaction.save();

        res.json({ message: 'Deleted successfully' });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}


module.exports = {
    createTransaction,
    getTransactions,
    getTransactionById,
    updateTransaction,
    deleteTransaction
};