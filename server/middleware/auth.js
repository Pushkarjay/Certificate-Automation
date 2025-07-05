const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'certifypro_db',
    ssl: process.env.MYSQL_SSL === 'true' ? { rejectUnauthorized: false } : false
};

// Authentication middleware
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    try {
        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
        
        // Check if user still exists and is active
        const connection = await mysql.createConnection(dbConfig);
        try {
            const [users] = await connection.execute(
                `SELECT id, email, first_name, last_name, role, is_verified, is_active, 
                        profile_picture, profile_completed
                 FROM users WHERE id = ? AND is_active = TRUE`,
                [decoded.id]
            );

            if (users.length === 0) {
                return res.status(401).json({ error: 'User not found or inactive' });
            }

            const user = users[0];
            
            // Add user info to request
            req.user = {
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                role: user.role,
                isVerified: user.is_verified,
                isActive: user.is_active,
                profilePicture: user.profile_picture,
                profileCompleted: user.profile_completed
            };

            next();
        } finally {
            await connection.end();
        }
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Invalid token' });
        } else if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired' });
        } else {
            console.error('Authentication error:', error);
            return res.status(500).json({ error: 'Authentication failed' });
        }
    }
};

// Optional authentication middleware (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        req.user = null;
        return next();
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
        
        const connection = await mysql.createConnection(dbConfig);
        try {
            const [users] = await connection.execute(
                `SELECT id, email, first_name, last_name, role, is_verified, is_active, 
                        profile_picture, profile_completed
                 FROM users WHERE id = ? AND is_active = TRUE`,
                [decoded.id]
            );

            if (users.length > 0) {
                const user = users[0];
                req.user = {
                    id: user.id,
                    email: user.email,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    role: user.role,
                    isVerified: user.is_verified,
                    isActive: user.is_active,
                    profilePicture: user.profile_picture,
                    profileCompleted: user.profile_completed
                };
            } else {
                req.user = null;
            }
        } finally {
            await connection.end();
        }
    } catch (error) {
        req.user = null;
    }

    next();
};

// Role-based authorization middleware
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const userRoles = Array.isArray(roles) ? roles : [roles];
        
        if (!userRoles.includes(req.user.role)) {
            return res.status(403).json({ 
                error: 'Insufficient permissions',
                required: userRoles,
                current: req.user.role
            });
        }

        next();
    };
};

// Admin only middleware
const requireAdmin = requireRole(['admin']);

// Verified user middleware
const requireVerified = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    if (!req.user.isVerified) {
        return res.status(403).json({ 
            error: 'Email verification required',
            message: 'Please verify your email address to access this feature'
        });
    }

    next();
};

// User owns resource middleware (for user-specific resources)
const requireOwnership = (userIdField = 'userId') => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        // Admin can access any resource
        if (req.user.role === 'admin') {
            return next();
        }

        // Check if user owns the resource
        const resourceUserId = req.params[userIdField] || req.body[userIdField];
        
        if (!resourceUserId) {
            return res.status(400).json({ error: 'Resource user ID not found' });
        }

        if (parseInt(resourceUserId) !== req.user.id) {
            return res.status(403).json({ 
                error: 'Access denied',
                message: 'You can only access your own resources'
            });
        }

        next();
    };
};

// Rate limiting by user ID
const userRateLimit = (windowMs = 15 * 60 * 1000, max = 100) => {
    const userRequests = new Map();

    return (req, res, next) => {
        const userId = req.user ? req.user.id : req.ip;
        const now = Date.now();
        const windowStart = now - windowMs;

        // Clean up old entries
        for (const [key, requests] of userRequests.entries()) {
            userRequests.set(key, requests.filter(time => time > windowStart));
            if (userRequests.get(key).length === 0) {
                userRequests.delete(key);
            }
        }

        // Check current user's requests
        const userRequestTimes = userRequests.get(userId) || [];
        
        if (userRequestTimes.length >= max) {
            return res.status(429).json({
                error: 'Rate limit exceeded',
                message: `Too many requests. Try again in ${Math.ceil(windowMs / 60000)} minutes.`
            });
        }

        // Add current request
        userRequestTimes.push(now);
        userRequests.set(userId, userRequestTimes);

        next();
    };
};

module.exports = {
    authenticateToken,
    optionalAuth,
    requireRole,
    requireAdmin,
    requireVerified,
    requireOwnership,
    userRateLimit
};
