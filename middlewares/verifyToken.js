const jwt = require('jsonwebtoken');
const User = require('../models/user'); 

const verifyToken = async (req, res, next) => {
    try {
        const token = req.header('Authorization').split(' ')[1];
        if(!token) 
            return res.status(404).json({Status: 'Failed', message: 'Token not found or invalid'})
        const decoded = jwt.verify(token, 'secretkey');
        const user = await User.findById(decoded.id);
        req.user = user;
        next();

    } catch (error) {
        res.status(404).json({
            Status: 'Failed', 
            message: 'Token not found or invalid',
            error: error
        })
    }
}

module.exports = verifyToken;