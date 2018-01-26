const Buyer = require('./buyer');
const Seller = require('./seller');

class watchdog {
    constructor(trexCfg, tradesCfg) {
        this.bittrex = require('node-bittrex-api');
        this.bittrex.options({
            'apikey': trexCfg.apiKey,
            'apisecret': trexCfg.apiSecret
        });
        this.tradesCfg = tradesCfg
    }

    processSignal(signal) {
        const coin = signal.coin;
        const price = signal.price;
        const buyer = new Buyer(this.bittrex, this.tradesCfg);
        buyer.checkBalanceAndBuy(coin, price, (bittrex, buyPrice, coinPair, coin, takeProfit) => {
            onOrderFilled(bittrex, buyPrice, coinPair, coin, takeProfit)
        });

        const onOrderFilled = function(bittrex, buyPrice, coinPair, coin, takeProfit) {
            const seller = new Seller(bittrex);
            seller.checkBalanceAndSell(buyPrice, coinPair, coin, takeProfit)
        }
    }
}

module.exports = watchdog;
