const express = require('express');
const app = express();
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser');
const server = require('http').Server(app);
const io = require('socket.io')(server);
const auth = require('./auth');
const oc = require('./orderController');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(cookieParser());
app.use(express.static('static'))

app.get('/show', auth.checkCookie, oc.show);
app.post('/auth', auth.verifyUser, auth.setCookie, (req, res) => res.redirect('/home.html'))
app.post('/upload', auth.checkCookie, oc.upload)
app.get('/search', auth.checkCookie, oc.search)

server.listen(3000, () => console.log(`App listening on port 3000!`))

io.on('connection', function (socket) {
    socket.on('subscribe', function (data) {
        data = JSON.parse(data);
        oc.orders
            .filter(order => data.indexOf(order['productId']) != -1)
            .forEach(order => socket.emit('order', JSON.stringify(order)))
    });
});