const mongoose = require('mongoose');
require('dotenv').config();

async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log('Successfully connected to the database');
    } catch (err) {
        console.error('Database connection failed:', err.message);
        process.exit(1);      
    }
}

module.exports = connectDB;
