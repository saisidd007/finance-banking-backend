const app = require('./app');
const connectDB = require('./db/db');
require('dotenv').config();

const PORT = process.env.PORT || 3000;

async function start() {
    await connectDB();
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

start();
