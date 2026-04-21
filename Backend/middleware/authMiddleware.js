import JWT from "jsonwebtoken";

export const authMiddleware = async (req, res, next) => {
    try {
        // ✅ Validate JWT_SECRET exists
        if (!process.env.JWT_SECRET) {
            console.error("❌ JWT_SECRET not configured in environment variables");
            return res.status(500).json({ message: 'Server configuration error' });
        }

        // ✅ Get authorization header
        const authHeader = req.headers.authorization;
        
        if (!authHeader) {
            console.warn("⚠️ No authorization header provided");
            return res.status(401).json({ message: 'No authorization header provided' });
        }

        if (!authHeader.startsWith('Bearer ')) {
            console.warn("⚠️ Invalid authorization header format");
            return res.status(401).json({ message: 'Invalid authorization header format. Use: Bearer <token>' });
        }

        // ✅ Extract token
        const token = authHeader.split(' ')[1];
        
        if (!token) {
            console.warn("⚠️ No token provided after Bearer");
            return res.status(401).json({ message: 'No token provided' });
        }

        // ✅ Verify token
        try {
            const decoded = JWT.verify(token, process.env.JWT_SECRET);
            
            // Store user info in req.user (standard Express practice)
            req.user = {
                userId: decoded.userId,
            };
            
            console.log(`✅ Token verified for userId: ${decoded.userId}`);
            next();
        } catch (verifyError) {
            if (verifyError.name === 'TokenExpiredError') {
                console.warn("⚠️ Token expired:", verifyError.message);
                return res.status(401).json({ message: 'Token expired. Please sign in again.' });
            } else if (verifyError.name === 'JsonWebTokenError') {
                console.warn("⚠️ Invalid token:", verifyError.message);
                return res.status(401).json({ message: 'Invalid token' });
            } else {
                console.warn("⚠️ Token verification failed:", verifyError.message);
                return res.status(401).json({ message: 'Authentication failed' });
            }
        }
    } catch (error) {
        console.error("❌ Unexpected error in authMiddleware:", error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};