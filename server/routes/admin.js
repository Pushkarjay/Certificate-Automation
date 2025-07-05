const express = require('express');
const mysql = require('mysql2/promise');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const CertificateMySQL = require('../models/CertificateMySQL');

const router = express.Router();

// Database configuration
const dbConfig = {
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'certifypro_db',
    ssl: process.env.MYSQL_SSL === 'true' ? { rejectUnauthorized: false } : false
};

// All admin routes require authentication and admin role
router.use(authenticateToken);
router.use(requireAdmin);

// GET /api/admin/dashboard - Get admin dashboard statistics
router.get('/dashboard', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    
    try {
        // Get user statistics
        const [userStats] = await connection.execute(`
            SELECT 
                COUNT(*) as total_users,
                SUM(CASE WHEN is_active = TRUE THEN 1 ELSE 0 END) as active_users,
                SUM(CASE WHEN is_verified = TRUE THEN 1 ELSE 0 END) as verified_users,
                SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admin_users,
                SUM(CASE WHEN oauth_provider = 'google' THEN 1 ELSE 0 END) as google_users,
                SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as new_users_30d
            FROM users
        `);

        // Get certificate statistics
        const [certStats] = await connection.execute(`
            SELECT 
                COUNT(*) as total_certificates,
                SUM(CASE WHEN is_active = TRUE THEN 1 ELSE 0 END) as active_certificates,
                SUM(CASE WHEN user_id IS NOT NULL THEN 1 ELSE 0 END) as claimed_certificates,
                SUM(CASE WHEN user_id IS NULL THEN 1 ELSE 0 END) as unclaimed_certificates,
                SUM(verification_count) as total_verifications,
                SUM(CASE WHEN issue_date >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as new_certificates_30d
            FROM certificates
        `);

        // Get recent activity
        const [recentUsers] = await connection.execute(`
            SELECT id, email, first_name, last_name, created_at, is_verified, oauth_provider
            FROM users 
            ORDER BY created_at DESC 
            LIMIT 10
        `);

        const [recentCertificates] = await connection.execute(`
            SELECT c.id, c.dof_no, c.name, c.program, c.issue_date, c.verification_count,
                   u.first_name as user_first_name, u.last_name as user_last_name
            FROM certificates c
            LEFT JOIN users u ON c.user_id = u.id
            ORDER BY c.issue_date DESC 
            LIMIT 10
        `);

        // Get verification logs (recent)
        const [recentVerifications] = await connection.execute(`
            SELECT vl.*, c.name as certificate_name, c.program
            FROM verification_logs vl
            LEFT JOIN certificates c ON vl.certificate_id = c.id
            ORDER BY vl.verified_at DESC
            LIMIT 20
        `);

        res.json({
            success: true,
            data: {
                stats: {
                    users: userStats[0],
                    certificates: certStats[0]
                },
                recentActivity: {
                    users: recentUsers,
                    certificates: recentCertificates,
                    verifications: recentVerifications
                }
            }
        });

    } catch (error) {
        console.error('Admin dashboard error:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard data' });
    } finally {
        await connection.end();
    }
});

// GET /api/admin/users - Get all users with pagination and search
router.get('/users', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search;
        const role = req.query.role;
        const status = req.query.status; // active, inactive, verified, unverified
        const offset = (page - 1) * limit;

        let whereConditions = [];
        let queryParams = [];

        if (search) {
            whereConditions.push('(first_name LIKE ? OR last_name LIKE ? OR email LIKE ?)');
            const searchPattern = `%${search}%`;
            queryParams.push(searchPattern, searchPattern, searchPattern);
        }

        if (role) {
            whereConditions.push('role = ?');
            queryParams.push(role);
        }

        if (status) {
            switch (status) {
                case 'active':
                    whereConditions.push('is_active = TRUE');
                    break;
                case 'inactive':
                    whereConditions.push('is_active = FALSE');
                    break;
                case 'verified':
                    whereConditions.push('is_verified = TRUE');
                    break;
                case 'unverified':
                    whereConditions.push('is_verified = FALSE');
                    break;
            }
        }

        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

        // Get users
        const [users] = await connection.execute(`
            SELECT id, email, first_name, last_name, secondary_email, phone_number,
                   role, is_verified, is_active, oauth_provider, profile_completed,
                   last_login_at, created_at, updated_at
            FROM users 
            ${whereClause}
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        `, [...queryParams, limit, offset]);

        // Get total count
        const [countResult] = await connection.execute(`
            SELECT COUNT(*) as total 
            FROM users 
            ${whereClause}
        `, queryParams);

        const total = countResult[0].total;
        const totalPages = Math.ceil(total / limit);

        // Get certificate counts for each user
        const userIds = users.map(user => user.id);
        const certCounts = {};

        if (userIds.length > 0) {
            const placeholders = userIds.map(() => '?').join(',');
            const [certCountsResult] = await connection.execute(`
                SELECT user_id, COUNT(*) as count
                FROM certificates 
                WHERE user_id IN (${placeholders}) AND is_active = TRUE
                GROUP BY user_id
            `, userIds);

            certCountsResult.forEach(row => {
                certCounts[row.user_id] = row.count;
            });
        }

        // Add certificate counts to user data
        const usersWithCertCounts = users.map(user => ({
            ...user,
            certificateCount: certCounts[user.id] || 0
        }));

        res.json({
            success: true,
            data: usersWithCertCounts,
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
        console.error('Admin get users error:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    } finally {
        await connection.end();
    }
});

// PUT /api/admin/users/:id - Update user (admin can modify user details and status)
router.put('/users/:id', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    
    try {
        const userId = parseInt(req.params.id);
        const { role, isActive, isVerified } = req.body;

        // Prevent admin from deactivating themselves
        if (userId === req.user.id && isActive === false) {
            return res.status(400).json({ 
                error: 'You cannot deactivate your own account' 
            });
        }

        // Validate role
        if (role && !['admin', 'user'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role' });
        }

        // Build update query dynamically
        let updates = [];
        let params = [];

        if (role !== undefined) {
            updates.push('role = ?');
            params.push(role);
        }

        if (isActive !== undefined) {
            updates.push('is_active = ?');
            params.push(isActive);
        }

        if (isVerified !== undefined) {
            updates.push('is_verified = ?');
            params.push(isVerified);
            
            if (isVerified) {
                updates.push('email_verified_at = CURRENT_TIMESTAMP');
            }
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No valid updates provided' });
        }

        updates.push('updated_at = CURRENT_TIMESTAMP');
        params.push(userId);

        await connection.execute(`
            UPDATE users 
            SET ${updates.join(', ')}
            WHERE id = ?
        `, params);

        // Get updated user
        const [users] = await connection.execute(`
            SELECT id, email, first_name, last_name, role, is_verified, is_active, 
                   oauth_provider, profile_completed, last_login_at, created_at, updated_at
            FROM users WHERE id = ?
        `, [userId]);

        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            success: true,
            message: 'User updated successfully',
            data: users[0]
        });

    } catch (error) {
        console.error('Admin update user error:', error);
        res.status(500).json({ error: 'Failed to update user' });
    } finally {
        await connection.end();
    }
});

// DELETE /api/admin/users/:id - Delete user (soft delete)
router.delete('/users/:id', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    
    try {
        const userId = parseInt(req.params.id);

        // Prevent admin from deleting themselves
        if (userId === req.user.id) {
            return res.status(400).json({ 
                error: 'You cannot delete your own account' 
            });
        }

        // Check if user exists
        const [users] = await connection.execute(
            'SELECT id, email FROM users WHERE id = ?',
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        await connection.beginTransaction();

        try {
            // Soft delete user
            await connection.execute(`
                UPDATE users SET 
                    is_active = FALSE,
                    email = CONCAT('deleted_', id, '@deleted.local'),
                    password_hash = NULL,
                    google_id = NULL,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `, [userId]);

            // Delete user sessions
            await connection.execute(
                'DELETE FROM user_sessions WHERE user_id = ?',
                [userId]
            );

            await connection.commit();

            res.json({
                success: true,
                message: 'User deleted successfully'
            });

        } catch (error) {
            await connection.rollback();
            throw error;
        }

    } catch (error) {
        console.error('Admin delete user error:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    } finally {
        await connection.end();
    }
});

// GET /api/admin/certificates/stats - Get certificate statistics
router.get('/certificates/stats', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    
    try {
        // Get monthly certificate issuance stats
        const [monthlyStats] = await connection.execute(`
            SELECT 
                DATE_FORMAT(issue_date, '%Y-%m') as month,
                COUNT(*) as certificates_issued,
                SUM(verification_count) as total_verifications
            FROM certificates
            WHERE issue_date >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
            GROUP BY DATE_FORMAT(issue_date, '%Y-%m')
            ORDER BY month DESC
        `);

        // Get program statistics
        const [programStats] = await connection.execute(`
            SELECT 
                program,
                COUNT(*) as count,
                SUM(verification_count) as total_verifications,
                AVG(verification_count) as avg_verifications
            FROM certificates
            WHERE is_active = TRUE
            GROUP BY program
            ORDER BY count DESC
            LIMIT 10
        `);

        // Get issuer statistics
        const [issuerStats] = await connection.execute(`
            SELECT 
                c.issuer_name,
                COUNT(*) as certificates_issued,
                SUM(c.verification_count) as total_verifications
            FROM certificates c
            WHERE c.issuer_name IS NOT NULL
            GROUP BY c.issuer_name
            ORDER BY certificates_issued DESC
            LIMIT 10
        `);

        res.json({
            success: true,
            data: {
                monthlyStats,
                programStats,
                issuerStats
            }
        });

    } catch (error) {
        console.error('Certificate stats error:', error);
        res.status(500).json({ error: 'Failed to fetch certificate statistics' });
    } finally {
        await connection.end();
    }
});

// GET /api/admin/verification-logs - Get verification logs
router.get('/verification-logs', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const status = req.query.status; // success, not_found
        const offset = (page - 1) * limit;

        let whereClause = '';
        let params = [];

        if (status) {
            whereClause = 'WHERE vl.verification_status = ?';
            params.push(status);
        }

        const [logs] = await connection.execute(`
            SELECT 
                vl.id, vl.dof_no, vl.ip_address, vl.user_agent, 
                vl.verification_status, vl.verified_at,
                c.name as certificate_name, c.program, c.ref_no
            FROM verification_logs vl
            LEFT JOIN certificates c ON vl.certificate_id = c.id
            ${whereClause}
            ORDER BY vl.verified_at DESC
            LIMIT ? OFFSET ?
        `, [...params, limit, offset]);

        // Get total count
        const [countResult] = await connection.execute(`
            SELECT COUNT(*) as total 
            FROM verification_logs vl
            ${whereClause}
        `, params);

        const total = countResult[0].total;
        const totalPages = Math.ceil(total / limit);

        res.json({
            success: true,
            data: logs,
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
        console.error('Verification logs error:', error);
        res.status(500).json({ error: 'Failed to fetch verification logs' });
    } finally {
        await connection.end();
    }
});

module.exports = router;
