const express = require('express');
const app = express();
const port = 3000;
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser');
const fs = require('fs');
const moment = require('moment');
const server = require('http').Server(app);
const io = require('socket.io')(server);

const auth = require('./auth');
const users = require('./users.json');
let customers = require('./customers.json');
customers = customers.reduce((obj, elm) => (obj[elm.name] = elm.address, obj), {});
let products = require('./products.json');
products = products.reduce((obj, elm) => (obj[elm.name] = elm.productId, obj), {});
let orders = transformOrders(require('./orders.json'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(cookieParser());
app.use(express.static('static'))

app.get('/show', auth.checkCookie, (req, res) => res.send(orders));
app.post('/auth', auth.verifyUser, auth.setCookie, (req, res) => res.redirect('/home.html'))
app.post('/upload', auth.checkCookie, upload)
app.get('/search', auth.checkCookie, search)

server.listen(port, () => console.log(`App listening on port ${port}!`))

/* POST /upload */
function upload(req, res) {
    if (typeof req.body == 'object') {
        let order = {};
        if (req.headers['content-type'] == 'application/json') order = req.body;
        else {
            if (typeof req.body.item == 'object') {
                req.body.items = req.body.item.map((product, idx) => ({
                    "item": product,
                    "quantity": req.body.quantity[idx]
                }))
            } else {
                req.body.items = [{
                    "item": req.body.item,
                    "quantity": req.body.quantity
                }];
            }
            delete req.body.item;
            delete req.body.quantity;
            Object.assign(order, req.body);
        }
        let current_orders = require('./orders.json');
        current_orders.push(order);
        fs.writeFileSync('orders.json', JSON.stringify(current_orders, null, 2));
        if (req.headers['content-type'] == 'application/json') res.send('ok');
        else res.redirect('/show.html');
    } else res.send('Err: Invalid input');
}

/* transform json file data to required schema */
function transformOrders(orders) {
    return orders.reduce((ar, elm) => {
        elm.items.forEach(item => {
            ar.push({
                "buyer": elm.buyer,
                "productId": products[item.item],
                "quantity": item.quantity,
                "shippingAddress": customers[elm.buyer],
                "shippingTarget": parseInt(moment(`${elm.shippingDate} ${elm.shippingTime}`, 'YYYY/MM/DD HH:mm').format('x'))
            })
        });
        return ar;
    }, [])
}

/* GET /search */
function search(req, res) {
    let filter = Object.keys(req.query)[0];
    let filter_array = orders.filter(order => order[filter] == req.query[filter]);
    res.end(JSON.stringify(filter_array));
}

io.on('connection', function (socket) {
    socket.on('subscribe', function (data) {
        data = JSON.parse(data);
        orders
            .filter(order => data.indexOf(order['productId']) != -1)
            .forEach(order => socket.emit('order', JSON.stringify(order)))
    });
});