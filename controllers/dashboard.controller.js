const transactionModel = require('../models/transaction.model');



function userScope(req) {
    return req.user.role === 'Viewer' ? {} : {};
} // this was there before to show a viewer only his transactions but later i wanted to allow a user to view dashboard BUT NOT ALLOW HIM TO SEE THE TRANSACTIONS


async function getSummary(req, res) {
    try {
        const transactions = await transactionModel.find({
            isDeleted: false,
            ...userScope(req)
        });

        let income = 0, expense = 0;

        transactions.forEach(t => {
            if (t.type === 'income') income += t.amount;
            else expense += t.amount;
        });

        res.json({
            totalIncome: income,
            totalExpenses: expense,
            netBalance: income - expense,
            totalTransactions: transactions.length
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}



async function getByCategory(req, res) {
    try {
        const transactions = await transactionModel.find({
            isDeleted: false,
            ...userScope(req)
        });

        const result = {};

        transactions.forEach(t => {
            if (!result[t.category]) result[t.category] = 0;
            result[t.category] += t.amount;
        });

        res.json(result);

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}



async function getMonthlyTrends(req, res) {
    try {
        const transactions = await transactionModel.find({
            isDeleted: false,
            ...userScope(req)
        });

        const result = {};

        transactions.forEach(t => {
            const month = new Date(t.date).getMonth() + 1;

            if (!result[month]) {
                result[month] = { income: 0, expense: 0 };
            }

            if (t.type === 'income') result[month].income += t.amount;
            else result[month].expense += t.amount;
        });

        res.json(result);

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

async function getWeeklyTrends(req, res) {
    try {
        const transactions = await transactionModel.find({
            isDeleted: false,
            ...userScope(req)
        });

        const result = {};

        transactions.forEach(t => {
            const week = Math.ceil(new Date(t.date).getDate() / 7);

            if (!result[week]) {
                result[week] = { income: 0, expense: 0 };
            }

            if (t.type === 'income') result[week].income += t.amount;
            else result[week].expense += t.amount;
        });

        res.json(result);

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}



async function getRecentActivity(req, res) {
    try {
        const transactions = await transactionModel
            .find({ isDeleted: false, ...userScope(req) })
            .sort({ date: -1 })
            .limit(5);

        res.json(transactions);

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}



async function getTopCategories(req, res) {
    try {
        const transactions = await transactionModel.find({
            isDeleted: false,
            ...userScope(req)
        });

        const result = {};

        transactions.forEach(t => {
            if (!result[t.category]) result[t.category] = 0;
            result[t.category] += t.amount;
        });

        const sorted = Object.entries(result)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        res.json(sorted);

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}


module.exports = {
    getSummary,
    getByCategory,
    getMonthlyTrends,
    getWeeklyTrends,
    getRecentActivity,
    getTopCategories
};