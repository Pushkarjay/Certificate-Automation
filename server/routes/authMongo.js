const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');

const router = express.Router();

// Google OAuth client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per IP
    message: { error: 'Too many authentication attempts, please try again later' }
});

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 login attempts per IP
    message: { error: 'Too many login attempts, please try again later' }
});

// JWT Token generation
const generateTokens = (user) => {
    const payload = {
        id: user._id,
        email: user.email,
        role: user.role
    };

    const accessToken = jwt.sign(payload, process.env.JWT_SECRET || 'fallback_secret', {
        expiresIn: '15m'
    });

    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET || 'refresh_fallback_secret', {
        expiresIn: '7d'
    });

    return { accessToken, refreshToken };
};

// Register endpoint
router.post('/register', authLimiter, async (req, res) => {
    try {
        const { email, password, firstName, lastName } = req.body;

        // Validation
        if (!email || !password || !firstName || !lastName) {
            return res.status(400).json({
                error: 'All fields are required'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                error: 'Password must be at least 6 characters long'
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(409).json({
                error: 'User with this email already exists'
            });
        }

        // Create new user
        const user = new User({
            email: email.toLowerCase(),
            password,
            firstName,
            lastName,
            authProvider: 'local',
            isVerified: true // Auto-verify for development
        });

        await user.save();

        // Generate tokens
        const { accessToken, refreshToken } = generateTokens(user);

        // Update last login
        user.lastLoginAt = new Date();
        await user.save();

        res.status(201).json({
            message: 'User registered successfully',
            user: user.toJSON(),
            token: accessToken,
            refreshToken
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            error: 'Internal server error during registration'
        });
    }
});

// Login endpoint
router.post('/login', loginLimiter, async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({
                error: 'Email and password are required'
            });
        }

        // Find user
        const user = await User.findOne({ 
            email: email.toLowerCase(),
            isActive: true
        });

        if (!user) {
            return res.status(401).json({
                error: 'Invalid email or password'
            });
        }

        // Check password
        const isValidPassword = await user.comparePassword(password);
        if (!isValidPassword) {
            return res.status(401).json({
                error: 'Invalid email or password'
            });
        }

        // Generate tokens
        const { accessToken, refreshToken } = generateTokens(user);

        // Update last login
        user.lastLoginAt = new Date();
        await user.save();

        res.json({
            message: 'Login successful',
            user: user.toJSON(),
            token: accessToken,
            refreshToken
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            error: 'Internal server error during login'
        });
    }
});

// Google OAuth login
router.post('/google', authLimiter, async (req, res) => {
    try {
        const { credential } = req.body;

        if (!credential) {
            return res.status(400).json({
                error: 'Google credential is required'
            });
        }

        // Verify Google token
        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();
        const { sub: googleId, email, given_name: firstName, family_name: lastName, picture } = payload;

        // Check if user exists
        let user = await User.findOne({
            $or: [
                { email: email.toLowerCase() },
                { googleId }
            ]
        });

        if (user) {
            // Update Google ID if not set
            if (!user.googleId) {
                user.googleId = googleId;
                user.authProvider = 'google';
                await user.save();
            }
        } else {
            // Create new user
            user = new User({
                email: email.toLowerCase(),
                firstName,
                lastName: lastName || '',
                googleId,
                authProvider: 'google',
                isVerified: true,
                profilePicture: picture
            });
            await user.save();
        }

        // Generate tokens
        const { accessToken, refreshToken } = generateTokens(user);

        // Update last login
        user.lastLoginAt = new Date();
        await user.save();

        res.json({
            message: 'Google login successful',
            user: user.toJSON(),
            token: accessToken,
            refreshToken
        });

    } catch (error) {
        console.error('Google OAuth error:', error);
        res.status(500).json({
            error: 'Internal server error during Google authentication'
        });
    }
});

// Refresh token endpoint
router.post('/refresh', async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(401).json({
                error: 'Refresh token is required'
            });
        }

        // Verify refresh token
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'refresh_fallback_secret');
        
        // Find user
        const user = await User.findById(decoded.id);
        if (!user || !user.isActive) {
            return res.status(401).json({
                error: 'Invalid refresh token'
            });
        }

        // Generate new tokens
        const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);

        res.json({
            token: accessToken,
            refreshToken: newRefreshToken
        });

    } catch (error) {
        console.error('Token refresh error:', error);
        res.status(401).json({
            error: 'Invalid refresh token'
        });
    }
});

// Get current user
router.get('/me', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({
                error: 'Access token is required'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
        const user = await User.findById(decoded.id);

        if (!user || !user.isActive) {
            return res.status(401).json({
                error: 'User not found'
            });
        }

        res.json({
            user: user.toJSON()
        });

    } catch (error) {
        console.error('Get user error:', error);
        res.status(401).json({
            error: 'Invalid access token'
        });
    }
});

// Logout endpoint
router.post('/logout', async (req, res) => {
    try {
        // In a more sophisticated setup, you would invalidate the token
        // For now, we'll just send a success response
        res.json({
            message: 'Logout successful'
        });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            error: 'Internal server error during logout'
        });
    }
});

module.exports = router;
