class seller {
    constructor(bittrex) {
        this.chalk = require('chalk')
        this.bittrex = bittrex
    }

    /**
     * Checks balance and places take-profit orders.
     * @param buyPrice
     * @param coinPair
     * @param coin
     */
    checkBalanceAndSell(buyPrice, coinPair, coin) {
        const that = this;
        this.bittrex.getbalance({ currency : coin }, function( data, err ) {
            if (err) {
                console.log(that.chalk.red("Balance retrieval error: " + err.message));
            }
            if (data) {
                const totalSellAmount = data.result.Balance;
                console.log(that.chalk.bgCyan(`===== PLACING TAKE-PROFIT ORDERS (${coinPair}) =====`));
                const keys = Object.keys(that.takeProfit)
                const last = keys[keys.length-1]
                keys.forEach(function(k) {
                    let amountMultiplier = parseFloat(that.takeProfit[k]) / 100;
                    let priceMultiplier = 1 + parseFloat(k)/100;
                    if (that.takeProfit.hasOwnProperty(k)) {
                        if (k===last) {
                            sellAll(coin, coinPair, buyPrice * priceMultiplier);
                        } else {
                            sell(coin, coinPair, totalSellAmount * amountMultiplier, buyPrice * priceMultiplier);
                        }
                    }
                })
            }
        });

        /**
         * Sell given amount of given coins for given price
         * @param coin
         * @param coinPair
         * @param sellAmount
         * @param sellPrice
         */
        var sell = function(coin, coinPair, sellAmount, sellPrice) {
            const that = this;
            this.bittrex.selllimit({market : coinPair, quantity : sellAmount, rate : sellPrice}, function ( data, err ) {
                if (err) {
                    console.log(that.chalk.red("Order LIMIT SELL error: " + err.message));
                }
                if (data) {
                    console.log(that.chalk.green(new Date() + ` Placed order to sell ${sellAmount} of ${coin} | Rate: ${sellPrice} | Total BTC: ${sellAmount*sellPrice} BTC | ID: ${data.result.uuid}`));
                }
            });
        }

        /**
         * Sell all of the current balance
         * @param coin
         * @param coinPair
         * @param sellPrice
         */
        var sellAll = function(coin, coinPair, sellPrice) {
            const that = this;
            this.bittrex.getbalance({ currency : coin }, function( data, err ) {
                if (err) {
                    console.log(that.chalk.red("Balance retrieval error: " + err.message));
                }
                if (data) {
                    const totalSellAmount = data.result.Available;
                    sell(coin, coinPair, totalSellAmount, sellPrice)
                }
            });
        }
    }
}

module.exports = seller
