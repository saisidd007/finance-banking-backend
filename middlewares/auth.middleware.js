const jwt = require('jsonwebtoken');

function authenticate(req, res, next) {
    //This is the middle ware for authentication of the user BASED ON THE TOKEN
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({ message: 'Authentication required. Please log in.' });
    }

    try {
        req.user = jwt.verify(token, process.env.JWT_KEY);
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Invalid or expired token. Please log in again.' });
    }
}


function authorize(...roles) {
    //ALLOW THE USER TO PROCEED TO THE NEXT FUNCTION ONLY IF HE IS AUTHORISED according to his role
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                message: `Access denied. Required role(s): ${roles.join(', ')}`,
            });
        }
        next();
    };
}

module.exports = { authenticate, authorize };
