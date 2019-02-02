const fs = require('fs');
const moment = require('moment');

const orderController = {};

orderController.customers = _transformObj(require('./customers.json'), 'address');
orderController.products = _transformObj(require('./products.json'), 'productId')
orderController.raw_orders = require('./orders.json');
orderController.orders = _transformOrders(orderController.raw_orders);

orderController.show = function (req, res) {
    res.send(orderController.orders);
}

orderController.upload = function upload(req, res) {
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

        orderController.raw_orders.push(order);
        fs.writeFileSync('orders.json', JSON.stringify(orderController.raw_orders, null, 2));
        orderController.orders = orderController.orders.concat(_transformOrders([order]));

        if (req.headers['content-type'] == 'application/json') res.send('ok');
        else res.redirect('/show.html');
    } else res.send('Err: Invalid input');
}

orderController.search = function search(req, res) {
    let filter = Object.keys(req.query)[0];
    let filter_array = orderController.orders.filter(order => order[filter] == req.query[filter]);
    res.end(JSON.stringify(filter_array));
}

function _transformOrders(orders) {
    return orders.reduce((ar, elm) => {
        elm.items.forEach(item => {
            ar.push({
                "buyer": elm.buyer,
                "productId": orderController.products[item.item],
                "quantity": item.quantity,
                "shippingAddress": orderController.customers[elm.buyer],
                "shippingTarget": parseInt(moment(`${elm.shippingDate} ${elm.shippingTime}`, 'YYYY/MM/DD HH:mm').format('x'))
            })
        });
        return ar;
    }, [])
}

function _transformObj(data, val, key = 'name') {
    return data.reduce((obj, elm) => (obj[elm[key]] = elm[val], obj), {});
}

module.exports = orderController;