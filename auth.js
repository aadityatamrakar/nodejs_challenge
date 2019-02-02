const users = require('./users.json');
const auth = {};

auth.verifyUser = (req, res, next) => {
    if (users.some(user => user.username == req.body.username && user.password == req.body.password))
        next();
    else
        res.redirect('/login.html');
}

auth.setCookie = (req, res, next) => {
    const option = {maxAge: 60000000};
    res.cookie('login', 'true', option);
    next();
}

auth.checkCookie = (req, res, next) => {
    if (req.cookies.login === 'true') next();
    else res.redirect('/login.html');
}

module.exports = auth;