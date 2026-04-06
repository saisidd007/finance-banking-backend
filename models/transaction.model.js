const mongoose = require('mongoose');
// This is the Transaction Schema // can be created by users only

const transactionSchema = new mongoose.Schema(
    {
        amount: {
            type: Number,
            required: true,
            min: [0, 'Amount must be a positive number'],
        },
        type: {
            type: String,
            enum: ['income', 'expense'],
            required: true,
        },
        category: {
            type: String,
            required: true,
            trim: true,
        },
        date: {
            type: Date,
            required: true,
        },
        notes: {
            type: String,
            default: '',
            trim: true,
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        isDeleted: {              
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Transaction', transactionSchema);
