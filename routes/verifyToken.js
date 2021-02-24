const jwt = require('jsonwebtoken')

module.exports = function(req, res, next) {
    const token = req.header("BD_TOKEN");
    if (!token) return res.send("Access denied");
    
    try {
        const verified = jwt.verify(token, process.env.TOKEN_SECRET);
        req.user = verified
        next()
    } catch(err) {
        res.status(400).send('Invalid token');
    }
}

