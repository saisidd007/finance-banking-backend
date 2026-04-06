const userModel = require('../models/user.model');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

function signToken(user) {
    return jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_KEY,
        { expiresIn: '7d' }
    );
}

async function registerUser(req, res) {
    try {
        const { username, email, password, role } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ message: 'username, email, and password are required' });
        }

        const existing = await userModel.findOne({ $or: [{ username }, { email }] });
        if (existing) {
            return res.status(409).json({ message: 'Username or email already in use' });
        }

        const hash = await bcrypt.hash(password, 10);

        const newUser = await userModel.create({ username, email, password: hash, role });

        const token = signToken(newUser);

        res.cookie('token', token, { httpOnly: true });   
        return res.status(201).json({
            message: 'User registered successfully',
            user: {
                id: newUser._id,
                username: newUser.username,
                email: newUser.email,
                role: newUser.role,
            },
        });
    } catch (err) {
        return res.status(500).json({ message: 'Registration failed', error: err.message });
    }
}

async function loginUser(req, res) {
    try {
        const { username, email, password } = req.body;

        if (!password || (!username && !email)) {
            return res.status(400).json({ message: 'Provide (username or email) and password' });
        }

        const user = await userModel.findOne({ $or: [{ username }, { email }] });
        if (!user) {
            return res.status(404).json({ message: 'No account found with those credentials' });
        }

        if (!user.isActive) {
            return res.status(403).json({ message: 'Account is deactivated. Contact an admin.' });
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = signToken(user);

        res.cookie('token', token, { httpOnly: true });
        return res.status(200).json({
            message: 'Logged in successfully',
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
            },
        });
    } catch (err) {
        return res.status(500).json({ message: 'Login failed', error: err.message });
    }
}

async function logoutUser(req, res) {
    res.clearCookie('token');
    return res.status(200).json({ message: 'Logged out successfully' });
}

// Admin only: list all users, toggle active status
async function getAllUsers(req, res) {
    try {
        const users = await userModel.find({}, '-password').sort({ createdAt: -1 });
        return res.status(200).json({ count: users.length, users });
    } catch (err) {
        return res.status(500).json({ message: 'Failed to fetch users', error: err.message });
    }
}

async function toggleUserStatus(req, res) {
    try {
        const user = await userModel.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.isActive = !user.isActive;
        await user.save();

        return res.status(200).json({
            message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
            isActive: user.isActive,
        });
    } catch (err) {
        return res.status(500).json({ message: 'Failed to update status', error: err.message });
    }
}

module.exports = { registerUser, loginUser, logoutUser, getAllUsers, toggleUserStatus };
