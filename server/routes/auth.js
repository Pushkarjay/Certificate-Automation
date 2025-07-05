const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// Database configuration
const dbConfig = {
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'certifypro_db',
    ssl: process.env.MYSQL_SSL === 'true' ? { rejectUnauthorized: false } : false
};

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
    max: 10, // 10 login attempts per IP
    message: { error: 'Too many login attempts, please try again later' }
});

// Helper function to generate JWT
const generateToken = (user) => {
    return jwt.sign(
        { 
            id: user.id, 
            email: user.email, 
            role: user.role,
            isVerified: user.is_verified 
        },
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
};

// Helper function to generate refresh token
const generateRefreshToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

// Helper function to hash password
const hashPassword = async (password) => {
    return await bcrypt.hash(password, 12);
};

// Helper function to validate password
const validatePassword = (password) => {
    const minLength = 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    if (password.length < minLength) {
        return { valid: false, message: 'Password must be at least 8 characters long' };
    }
    if (!hasUpper || !hasLower) {
        return { valid: false, message: 'Password must contain both uppercase and lowercase letters' };
    }
    if (!hasNumber) {
        return { valid: false, message: 'Password must contain at least one number' };
    }
    if (!hasSpecial) {
        return { valid: false, message: 'Password must contain at least one special character' };
    }
    
    return { valid: true };
};

// User registration
router.post('/register', authLimiter, async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    
    try {
        const { 
            email, 
            password, 
            firstName, 
            lastName, 
            secondaryEmail, 
            phoneNumber,
            gender,
            dateOfBirth 
        } = req.body;

        // Validate required fields
        if (!email || !password || !firstName || !lastName) {
            return res.status(400).json({ 
                error: 'Email, password, first name, and last name are required' 
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        // Validate password
        const passwordValidation = validatePassword(password);
        if (!passwordValidation.valid) {
            return res.status(400).json({ error: passwordValidation.message });
        }

        // Check if user already exists
        const [existingUsers] = await connection.execute(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );

        if (existingUsers.length > 0) {
            return res.status(409).json({ error: 'User with this email already exists' });
        }

        // Hash password
        const passwordHash = await hashPassword(password);

        // Generate verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // Insert new user
        const [result] = await connection.execute(
            `INSERT INTO users (
                email, password_hash, first_name, last_name, secondary_email, 
                phone_number, gender, date_of_birth, oauth_provider
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'local')`,
            [email, passwordHash, firstName, lastName, secondaryEmail, phoneNumber, gender, dateOfBirth]
        );

        const userId = result.insertId;

        // Insert verification token
        await connection.execute(
            `INSERT INTO email_verification_tokens (user_id, token, expires_at) 
             VALUES (?, ?, ?)`,
            [userId, verificationToken, verificationExpires]
        );

        // Generate JWT token
        const user = {
            id: userId,
            email,
            role: 'user',
            is_verified: false
        };
        const token = generateToken(user);
        const refreshToken = generateRefreshToken();

        // Store refresh token in database
        await connection.execute(
            `INSERT INTO user_sessions (user_id, refresh_token, expires_at, created_at) 
             VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 30 DAY), NOW())`,
            [userId, refreshToken]
        );

        res.status(201).json({
            message: 'User registered successfully',
            user: {
                id: userId,
                email,
                firstName,
                lastName,
                role: 'user',
                isVerified: false
            },
            token,
            refreshToken,
            verificationToken // In production, send this via email instead
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    } finally {
        await connection.end();
    }
});

// User login
router.post('/login', loginLimiter, async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Find user
        const [users] = await connection.execute(
            `SELECT id, email, password_hash, first_name, last_name, role, 
                    is_verified, is_active, oauth_provider
             FROM users WHERE email = ?`,
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = users[0];

        // Check if account is active
        if (!user.is_active) {
            return res.status(403).json({ error: 'Account is deactivated' });
        }

        // Check if user is OAuth user trying to login with password
        if (user.oauth_provider !== 'local') {
            return res.status(400).json({ 
                error: 'Please login with Google OAuth',
                provider: user.oauth_provider 
            });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Update last login
        await connection.execute(
            'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?',
            [user.id]
        );

        // Generate tokens
        const token = generateToken(user);
        const refreshToken = generateRefreshToken();

        // Store refresh token
        await connection.execute(
            `INSERT INTO user_sessions (user_id, refresh_token, expires_at, created_at) 
             VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 30 DAY), NOW())`,
            [user.id, refreshToken]
        );

        res.json({
            message: 'Login successful',
            user: {
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                role: user.role,
                isVerified: user.is_verified
            },
            token,
            refreshToken
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    } finally {
        await connection.end();
    }
});

// Google OAuth login
router.post('/google', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    
    try {
        const { tokenId } = req.body;

        if (!tokenId) {
            return res.status(400).json({ error: 'Google token is required' });
        }

        // Verify Google token
        const ticket = await googleClient.verifyIdToken({
            idToken: tokenId,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();
        const { sub: googleId, email, given_name: firstName, family_name: lastName, picture } = payload;

        // Check if user exists
        let [users] = await connection.execute(
            'SELECT * FROM users WHERE google_id = ? OR email = ?',
            [googleId, email]
        );

        let user;
        let isNewUser = false;

        if (users.length === 0) {
            // Create new user
            const [result] = await connection.execute(
                `INSERT INTO users (
                    email, first_name, last_name, google_id, oauth_provider, 
                    is_verified, email_verified_at, profile_picture
                ) VALUES (?, ?, ?, ?, 'google', TRUE, CURRENT_TIMESTAMP, ?)`,
                [email, firstName, lastName, googleId, picture]
            );

            user = {
                id: result.insertId,
                email,
                first_name: firstName,
                last_name: lastName,
                role: 'user',
                is_verified: true,
                is_active: true
            };
            isNewUser = true;
        } else {
            user = users[0];
            
            // Update Google ID if missing
            if (!user.google_id) {
                await connection.execute(
                    'UPDATE users SET google_id = ?, oauth_provider = "google" WHERE id = ?',
                    [googleId, user.id]
                );
            }
        }

        // Update last login
        await connection.execute(
            'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?',
            [user.id]
        );

        // Generate tokens
        const token = generateToken(user);
        const refreshToken = generateRefreshToken();

        // Store refresh token
        await connection.execute(
            `INSERT INTO user_sessions (user_id, refresh_token, expires_at, created_at) 
             VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 30 DAY), NOW())`,
            [user.id, refreshToken]
        );

        res.json({
            message: isNewUser ? 'Account created successfully' : 'Login successful',
            user: {
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                role: user.role,
                isVerified: user.is_verified
            },
            token,
            refreshToken,
            isNewUser
        });

    } catch (error) {
        console.error('Google OAuth error:', error);
        res.status(500).json({ error: 'Google authentication failed' });
    } finally {
        await connection.end();
    }
});

// Refresh token
router.post('/refresh', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({ error: 'Refresh token is required' });
        }

        // Verify refresh token
        const [sessions] = await connection.execute(
            `SELECT s.*, u.email, u.first_name, u.last_name, u.role, u.is_verified, u.is_active
             FROM user_sessions s
             JOIN users u ON s.user_id = u.id
             WHERE s.refresh_token = ? AND s.expires_at > NOW()`,
            [refreshToken]
        );

        if (sessions.length === 0) {
            return res.status(401).json({ error: 'Invalid or expired refresh token' });
        }

        const session = sessions[0];

        // Check if user is active
        if (!session.is_active) {
            return res.status(403).json({ error: 'Account is deactivated' });
        }

        // Generate new tokens
        const user = {
            id: session.user_id,
            email: session.email,
            role: session.role,
            is_verified: session.is_verified
        };
        const newToken = generateToken(user);
        const newRefreshToken = generateRefreshToken();

        // Update refresh token
        await connection.execute(
            'UPDATE user_sessions SET refresh_token = ?, expires_at = DATE_ADD(NOW(), INTERVAL 30 DAY) WHERE id = ?',
            [newRefreshToken, session.id]
        );

        res.json({
            token: newToken,
            refreshToken: newRefreshToken,
            user: {
                id: session.user_id,
                email: session.email,
                firstName: session.first_name,
                lastName: session.last_name,
                role: session.role,
                isVerified: session.is_verified
            }
        });

    } catch (error) {
        console.error('Token refresh error:', error);
        res.status(500).json({ error: 'Token refresh failed' });
    } finally {
        await connection.end();
    }
});

// Logout
router.post('/logout', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    
    try {
        const { refreshToken } = req.body;

        if (refreshToken) {
            // Delete the refresh token
            await connection.execute(
                'DELETE FROM user_sessions WHERE refresh_token = ?',
                [refreshToken]
            );
        }

        res.json({ message: 'Logout successful' });

    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ error: 'Logout failed' });
    } finally {
        await connection.end();
    }
});

// Verify email
router.post('/verify-email', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({ error: 'Verification token is required' });
        }

        // Find verification token
        const [tokens] = await connection.execute(
            `SELECT vt.*, u.email FROM email_verification_tokens vt
             JOIN users u ON vt.user_id = u.id
             WHERE vt.token = ? AND vt.expires_at > NOW() AND vt.used_at IS NULL`,
            [token]
        );

        if (tokens.length === 0) {
            return res.status(400).json({ error: 'Invalid or expired verification token' });
        }

        const verificationToken = tokens[0];

        // Update user as verified
        await connection.execute(
            'UPDATE users SET is_verified = TRUE, email_verified_at = CURRENT_TIMESTAMP WHERE id = ?',
            [verificationToken.user_id]
        );

        // Mark token as used
        await connection.execute(
            'UPDATE email_verification_tokens SET used_at = CURRENT_TIMESTAMP WHERE id = ?',
            [verificationToken.id]
        );

        res.json({
            message: 'Email verified successfully',
            email: verificationToken.email
        });

    } catch (error) {
        console.error('Email verification error:', error);
        res.status(500).json({ error: 'Email verification failed' });
    } finally {
        await connection.end();
    }
});

// Forgot password
router.post('/forgot-password', authLimiter, async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        // Find user
        const [users] = await connection.execute(
            'SELECT id, oauth_provider FROM users WHERE email = ? AND is_active = TRUE',
            [email]
        );

        // Always return success to prevent email enumeration
        if (users.length === 0) {
            return res.json({ 
                message: 'If the email exists, a password reset link has been sent' 
            });
        }

        const user = users[0];

        // Check if user is OAuth user
        if (user.oauth_provider !== 'local') {
            return res.json({ 
                message: 'If the email exists, a password reset link has been sent' 
            });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        // Store reset token
        await connection.execute(
            `INSERT INTO password_reset_tokens (user_id, token, expires_at) 
             VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE token = VALUES(token), expires_at = VALUES(expires_at), created_at = NOW()`,
            [user.id, resetToken, resetExpires]
        );

        res.json({
            message: 'If the email exists, a password reset link has been sent',
            resetToken // In production, send this via email instead
        });

    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ error: 'Password reset request failed' });
    } finally {
        await connection.end();
    }
});

// Reset password
router.post('/reset-password', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({ error: 'Token and new password are required' });
        }

        // Validate password
        const passwordValidation = validatePassword(newPassword);
        if (!passwordValidation.valid) {
            return res.status(400).json({ error: passwordValidation.message });
        }

        // Find reset token
        const [tokens] = await connection.execute(
            `SELECT rt.*, u.email FROM password_reset_tokens rt
             JOIN users u ON rt.user_id = u.id
             WHERE rt.token = ? AND rt.expires_at > NOW() AND rt.used_at IS NULL`,
            [token]
        );

        if (tokens.length === 0) {
            return res.status(400).json({ error: 'Invalid or expired reset token' });
        }

        const resetToken = tokens[0];

        // Hash new password
        const passwordHash = await hashPassword(newPassword);

        // Update password
        await connection.execute(
            'UPDATE users SET password_hash = ? WHERE id = ?',
            [passwordHash, resetToken.user_id]
        );

        // Mark token as used
        await connection.execute(
            'UPDATE password_reset_tokens SET used_at = CURRENT_TIMESTAMP WHERE id = ?',
            [resetToken.id]
        );

        // Invalidate all user sessions
        await connection.execute(
            'DELETE FROM user_sessions WHERE user_id = ?',
            [resetToken.user_id]
        );

        res.json({
            message: 'Password reset successfully',
            email: resetToken.email
        });

    } catch (error) {
        console.error('Password reset error:', error);
        res.status(500).json({ error: 'Password reset failed' });
    } finally {
        await connection.end();
    }
});

module.exports = router;
