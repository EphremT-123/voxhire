const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        console.log('❌ AUTH: No token provided');
        return res.status(401).json({ message: 'Not authorized, no token' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('✅ AUTH: Token decoded, User ID:', decoded.id);

        req.user = await User.findById(decoded.id).select('-password');

        if (!req.user) {
            console.log('❌ AUTH: User not found in database');
            return res.status(401).json({ message: 'User not found' });
        }

        console.log('✅ AUTH: User found - Name:', req.user.name, '| Role:', req.user.role, '| Email:', req.user.email);
        next();
    } catch (error) {
        console.log('❌ AUTH: Token verification failed -', error.message);
        return res.status(401).json({ message: 'Not authorized, token failed' });
    }
};

const authorize = (...roles) => {
    return (req, res, next) => {
        console.log('========== AUTHORIZE CHECK ==========');
        console.log('User ID:', req.user?._id);
        console.log('User Name:', req.user?.name);
        console.log('User Role:', req.user?.role);
        console.log('Allowed Roles:', roles);
        console.log('Role Match:', roles.includes(req.user?.role));
        console.log('=====================================');

        if (!req.user) {
            return res.status(401).json({ message: 'User not found in request' });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                message: `Role '${req.user.role}' is not authorized. Allowed roles: ${roles.join(', ')}`
            });
        }
        next();
    };
};

module.exports = { protect, authorize };