const express = require('express');
const cookieParser = require('cookie-parser');  // BUG FIX: was missing — req.cookies was always undefined

const authRouter        = require('./routes/routes.auth');
const transactionRouter = require('./routes/routes.transaction');
const dashboardRouter   = require('./routes/routes.dashboard');

const app = express();

// ─── GLOBAL MIDDLEWARE ────────────────────────────────────────────────────────
app.use(express.json());
app.use(cookieParser());   // must come before any route that reads req.cookies

// ─── ROUTES ───────────────────────────────────────────────────────────────────
app.use('/api/auth',         authRouter);
app.use('/api/transactions', transactionRouter);
app.use('/api/dashboard',    dashboardRouter);

app.get('/', (req, res) => {
    res.send("API is running 🚀");
});

// ─── HEALTH CHECK ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

// ─── 404 HANDLER ──────────────────────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ message: `Route ${req.method} ${req.path} not found` });
});

// ─── GLOBAL ERROR HANDLER ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Internal server error', error: err.message });
});

module.exports = app;
