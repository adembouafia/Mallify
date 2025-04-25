module.exports = (...allowedRoles) => {
    return (req, res, next) => {
        const user = req.user;

        if (!user || !user.role) {
            return res.status(403).json({ message: "Access forbidden: user role not found." });
        }

        if (!allowedRoles.includes(user.role)) {
            return res.status(403).json({ message: "Access denied: insufficient permissions." });
        }

        next(); 
    };
};
