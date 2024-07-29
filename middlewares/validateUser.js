const validateNewUser = (req, res, next) => {
    const {username, email, password} = req.body;
    if(!username || !email || !password) {
        res.status(401).json({
            status: 'Failed',
            message: 'Please provide all the fields'
        })
    }
    const emailRegex = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if(!emailRegex.test(email)) {
        res.status(400).json({
            status: 'Failed',
            message: 'Please provide a valid email'
        })
    }
    next();
}

module.exports = validateNewUser;