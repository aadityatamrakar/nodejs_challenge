let customers = require('./customers.json');
customers = customers.reduce((obj, elm) => (obj[elm.name] = elm.address, obj), {});
let products = require('./products.json');
products = products.reduce((obj, elm) => (obj[elm.name] = elm.productId, obj), {});
let raw_orders = require('./orders.json');
let orders = _transformOrders(raw_orders);

const orderController = {};

orderController.show = function (req, res) {
    res.send(orders);
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

        raw_orders.push(order);
        fs.writeFileSync('orders.json', JSON.stringify(raw_orders, null, 2));
        orders = orders.concat(_transformOrders([order]));

        if (req.headers['content-type'] == 'application/json') res.send('ok');
        else res.redirect('/show.html');
    } else res.send('Err: Invalid input');
}

orderController.search = function search(req, res) {
    let filter = Object.keys(req.query)[0];
    let filter_array = orders.filter(order => order[filter] == req.query[filter]);
    res.end(JSON.stringify(filter_array));
}

function _transformOrders(orders) {
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

module.exports = orderController;