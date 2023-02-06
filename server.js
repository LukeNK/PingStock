const bodyParser = require('body-parser');
const express = require('express');
const path = require('path');
const app = express();
const port = 8080;

class Stock {
    constructor(name, url) {
        this.name = name;
        this.url = url;
        this.history = [];
        this.passes = 0; // how many pass was invoked?
        this.pass(); // initial value
    }
    pass() {
        let cur = new Date(); // time before ping
        return fetch(this.url).then(res => res.text())
        .then(_ => this.value = new Date() - cur) // time after ping
    }
}

class Client {
    constructor(money) {
        this.money = money;
        this.stocks = [];
        this.feePerTran = 30;
        this.feePerStock = 10;
    }
    /**
     * Buy or sell a stock
     * @param {Stock|String} stock Stock for transaction
     * @param {Number} amount How many stock involve in the transaction, + for buy
     * @returns {Number} The price of the transaction
     */
    transaction(stock, amount) {
        if (typeof(stock) == 'string') 
            stock = STOCK_LIST[stock];
        let price = stock.value * amount;
        this.money -= price ;
        // if stock never init before
        if (!this.stocks[stock.name]) this.stocks[stock.name] = 0;
        this.stocks[stock.name] += amount;
        this.money -= (this.feePerTran + this.feePerStock * amount);
        return price;
    }
}

// game settings
const PASSES_PER_DAY = 10; // how many passes for a day for chart
// all stock available
let STOCK_LIST = {
    CAPM: 'https://pm.gc.ca/en',
    CANGOV: 'https://www.canada.ca/',
    DISC: 'https://discord.com/'
}
let PLAYER = new Client(10000);

// Initialize function
(() => {
    // create stock from stock list
    for (const name in STOCK_LIST) {
        let url = STOCK_LIST[name];
        STOCK_LIST[name] = new Stock(name, url);
    }
})();

// server
app.use(bodyParser.json())
// information route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/stocks', (req, res) => {
    let list = [];
    for (const name in STOCK_LIST) list.push({
        name: name, 
        value: STOCK_LIST[name].value,
        amount: PLAYER.stocks[name]
    });
    res.send(JSON.stringify(list));
})

app.get('/stock/:name', (req, res) => {
    let name = req.params.name;
    res.send(JSON.stringify(STOCK_LIST[name].history));
})

app.get('/player', (req, res) => {
    res.send(JSON.stringify(PLAYER));
})

// action route
app.get('/pass', (req, res) => {
    for (const name in STOCK_LIST) 
        STOCK_LIST[name].pass()
        .then(val => {
            let stock = STOCK_LIST[name];
            if (stock.passes % PASSES_PER_DAY == 0) {
                // new day
                stock.history.push([
                    val, val, val, val
                ])
            } else {
                // still same day
                let today = stock.history.at(-1);
                if (today[1] < val) today[1] = val; // high
                else if (today[2] > val) today[2] = val; // low
                today[3] = val; // close values
            }
            stock.passes++;
        });
    res.send('ok');
})

app.post('/tran', (req, res) => {
    let body = req.body;
    // if action is positive means buy
    PLAYER.transaction(
        body.name, 
        parseInt(body.amount) * ((body.act)? 1 : -1));
    res.send('ok')
})

app.listen(port, () => {
    console.log(`Listening on port ${port}`)
})