const express = require('express');
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

const { authenticateToken, requireVerified, requireOwnership } = require('../middleware/auth');

const router = express.Router();

// Database configuration
const dbConfig = {
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'certifypro_db',
    ssl: process.env.MYSQL_SSL === 'true' ? { rejectUnauthorized: false } : false
};

// Multer configuration for profile picture uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/profiles/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPEG, PNG, and GIF images are allowed.'));
        }
    }
});

// Get current user profile
router.get('/me', authenticateToken, async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    
    try {
        const [users] = await connection.execute(
            `SELECT id, email, first_name, last_name, secondary_email, phone_number, 
                    gender, date_of_birth, profile_picture, bio, role, is_verified, 
                    oauth_provider, profile_completed, email_verified_at, last_login_at,
                    created_at, updated_at
             FROM users WHERE id = ?`,
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = users[0];

        // Get user's certificate count
        const [certCount] = await connection.execute(
            'SELECT COUNT(*) as count FROM certificates WHERE user_id = ?',
            [req.user.id]
        );

        res.json({
            user: {
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                secondaryEmail: user.secondary_email,
                phoneNumber: user.phone_number,
                gender: user.gender,
                dateOfBirth: user.date_of_birth,
                profilePicture: user.profile_picture,
                bio: user.bio,
                role: user.role,
                isVerified: user.is_verified,
                oauthProvider: user.oauth_provider,
                profileCompleted: user.profile_completed,
                emailVerifiedAt: user.email_verified_at,
                lastLoginAt: user.last_login_at,
                createdAt: user.created_at,
                updatedAt: user.updated_at
            },
            stats: {
                certificateCount: certCount[0].count
            }
        });

    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    } finally {
        await connection.end();
    }
});

// Update user profile
router.put('/me', authenticateToken, async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    
    try {
        const {
            firstName,
            lastName,
            secondaryEmail,
            phoneNumber,
            gender,
            dateOfBirth,
            bio
        } = req.body;

        // Validate required fields
        if (!firstName || !lastName) {
            return res.status(400).json({ 
                error: 'First name and last name are required' 
            });
        }

        // Validate secondary email format if provided
        if (secondaryEmail) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(secondaryEmail)) {
                return res.status(400).json({ error: 'Invalid secondary email format' });
            }
        }

        // Update user profile
        await connection.execute(
            `UPDATE users SET 
                first_name = ?, last_name = ?, secondary_email = ?, 
                phone_number = ?, gender = ?, date_of_birth = ?, bio = ?,
                profile_completed = TRUE, updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [firstName, lastName, secondaryEmail, phoneNumber, gender, dateOfBirth, bio, req.user.id]
        );

        // Fetch updated user data
        const [users] = await connection.execute(
            `SELECT id, email, first_name, last_name, secondary_email, phone_number, 
                    gender, date_of_birth, profile_picture, bio, role, is_verified, 
                    profile_completed
             FROM users WHERE id = ?`,
            [req.user.id]
        );

        const user = users[0];

        res.json({
            message: 'Profile updated successfully',
            user: {
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                secondaryEmail: user.secondary_email,
                phoneNumber: user.phone_number,
                gender: user.gender,
                dateOfBirth: user.date_of_birth,
                profilePicture: user.profile_picture,
                bio: user.bio,
                role: user.role,
                isVerified: user.is_verified,
                profileCompleted: user.profile_completed
            }
        });

    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    } finally {
        await connection.end();
    }
});

// Upload profile picture
router.post('/me/avatar', authenticateToken, upload.single('avatar'), async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const profilePicturePath = `/uploads/profiles/${req.file.filename}`;

        // Update user's profile picture
        await connection.execute(
            'UPDATE users SET profile_picture = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [profilePicturePath, req.user.id]
        );

        res.json({
            message: 'Profile picture updated successfully',
            profilePicture: profilePicturePath
        });

    } catch (error) {
        console.error('Upload avatar error:', error);
        res.status(500).json({ error: 'Failed to upload profile picture' });
    } finally {
        await connection.end();
    }
});

// Change password
router.put('/me/password', authenticateToken, async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ 
                error: 'Current password and new password are required' 
            });
        }

        // Get user's current password hash
        const [users] = await connection.execute(
            'SELECT password_hash, oauth_provider FROM users WHERE id = ?',
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = users[0];

        // Check if user is OAuth user
        if (user.oauth_provider !== 'local') {
            return res.status(400).json({ 
                error: 'Cannot change password for OAuth users',
                provider: user.oauth_provider 
            });
        }

        // Verify current password
        const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
        if (!isValidPassword) {
            return res.status(400).json({ error: 'Current password is incorrect' });
        }

        // Validate new password
        const minLength = 8;
        const hasUpper = /[A-Z]/.test(newPassword);
        const hasLower = /[a-z]/.test(newPassword);
        const hasNumber = /\d/.test(newPassword);
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);
        
        if (newPassword.length < minLength) {
            return res.status(400).json({ 
                error: 'New password must be at least 8 characters long' 
            });
        }
        if (!hasUpper || !hasLower) {
            return res.status(400).json({ 
                error: 'New password must contain both uppercase and lowercase letters' 
            });
        }
        if (!hasNumber) {
            return res.status(400).json({ 
                error: 'New password must contain at least one number' 
            });
        }
        if (!hasSpecial) {
            return res.status(400).json({ 
                error: 'New password must contain at least one special character' 
            });
        }

        // Hash new password
        const newPasswordHash = await bcrypt.hash(newPassword, 12);

        // Update password
        await connection.execute(
            'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [newPasswordHash, req.user.id]
        );

        // Invalidate all user sessions except current one (optional)
        // await connection.execute(
        //     'DELETE FROM user_sessions WHERE user_id = ?',
        //     [req.user.id]
        // );

        res.json({ message: 'Password updated successfully' });

    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ error: 'Failed to change password' });
    } finally {
        await connection.end();
    }
});

// Get user's certificates
router.get('/me/certificates', authenticateToken, async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        // Get user's certificates with pagination
        const [certificates] = await connection.execute(
            `SELECT c.*, o.name as organization_name 
             FROM certificates c
             LEFT JOIN organizations o ON c.organization_id = o.id
             WHERE c.user_id = ?
             ORDER BY c.issued_date DESC
             LIMIT ? OFFSET ?`,
            [req.user.id, limit, offset]
        );

        // Get total count
        const [countResult] = await connection.execute(
            'SELECT COUNT(*) as total FROM certificates WHERE user_id = ?',
            [req.user.id]
        );

        const total = countResult[0].total;
        const totalPages = Math.ceil(total / limit);

        res.json({
            certificates,
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1
            }
        });

    } catch (error) {
        console.error('Get user certificates error:', error);
        res.status(500).json({ error: 'Failed to fetch certificates' });
    } finally {
        await connection.end();
    }
});

// Delete user account
router.delete('/me', authenticateToken, async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    
    try {
        const { password, confirmDelete } = req.body;

        if (confirmDelete !== 'DELETE_MY_ACCOUNT') {
            return res.status(400).json({ 
                error: 'Please confirm account deletion by sending "DELETE_MY_ACCOUNT"' 
            });
        }

        // For OAuth users, skip password verification
        if (req.user.oauthProvider === 'local') {
            if (!password) {
                return res.status(400).json({ error: 'Password is required for account deletion' });
            }

            // Verify password
            const [users] = await connection.execute(
                'SELECT password_hash FROM users WHERE id = ?',
                [req.user.id]
            );

            if (users.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }

            const isValidPassword = await bcrypt.compare(password, users[0].password_hash);
            if (!isValidPassword) {
                return res.status(400).json({ error: 'Invalid password' });
            }
        }

        await connection.beginTransaction();

        try {
            // Delete user sessions
            await connection.execute(
                'DELETE FROM user_sessions WHERE user_id = ?',
                [req.user.id]
            );

            // Delete verification tokens
            await connection.execute(
                'DELETE FROM email_verification_tokens WHERE user_id = ?',
                [req.user.id]
            );

            // Delete password reset tokens
            await connection.execute(
                'DELETE FROM password_reset_tokens WHERE user_id = ?',
                [req.user.id]
            );

            // Soft delete user (mark as inactive instead of hard delete to preserve certificate integrity)
            await connection.execute(
                `UPDATE users SET 
                    is_active = FALSE, 
                    email = CONCAT('deleted_', id, '@deleted.local'),
                    password_hash = NULL,
                    google_id = NULL,
                    profile_picture = NULL,
                    updated_at = CURRENT_TIMESTAMP
                 WHERE id = ?`,
                [req.user.id]
            );

            await connection.commit();

            res.json({ message: 'Account deleted successfully' });

        } catch (error) {
            await connection.rollback();
            throw error;
        }

    } catch (error) {
        console.error('Delete account error:', error);
        res.status(500).json({ error: 'Failed to delete account' });
    } finally {
        await connection.end();
    }
});

module.exports = router;
