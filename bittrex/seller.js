const log = require('../log');

class seller {
    constructor(bittrex) {
        this.bittrex = bittrex
    }

    /**
     * Checks balance and places take-profit orders.
     * @param buyPrice
     * @param coinPair
     * @param coin
     * @param takeProfit
     */
    checkBalanceAndSell(buyPrice, coinPair, coin, takeProfit) {

        /**
         * Sell all of the current balance
         * @param bittrex
         * @param coin
         * @param coinPair
         * @param sellPrice
         */
        const sellAll = function(bittrex, coin, coinPair, sellPrice) {
            bittrex.getbalance({ currency : coin }, (data, err) => {
                if (err) {
                    log("ERROR", "Balance retrieval error: " + err.message)
                }
                if (data) {
                    const totalSellAmount = data.result.Available;
                    sell(bittrex, coin, coinPair, totalSellAmount, sellPrice)
                }
            });
        };

        /**
         * Sell given amount of given coins for given price
         * @param bittrex
         * @param coin
         * @param coinPair
         * @param sellAmount
         * @param sellPrice
         */
        const sell = function(bittrex, coin, coinPair, sellAmount, sellPrice) {
            log("INFO", `Placing order to sell ${sellAmount} of ${coin} | Rate: ${sellPrice} | Total BTC: ${sellAmount*sellPrice} BTC`, true);
            bittrex.selllimit({market : coinPair, quantity : sellAmount, rate : sellPrice}, (data, err) => {
                if (err) {
                    log("ERROR", "Order LIMIT SELL error: " + err.message)
                }
                if (data) {
                    log("INFO", `Order placed successfully. ID: ${data.result.uuid}`, true)
                }
            });
        };

        const bittrex = this.bittrex;
        bittrex.getbalance({ currency : coin }, (data, err) => {
            if (err) {
                log("ERROR", "Balance retrieval error: " + err.message)
            }
            if (data) {
                const totalSellAmount = data.result.Balance;
                log("INFO", `===== TAKE-PROFIT ORDERS (${coinPair}) =====`);
                const keys = Object.keys(takeProfit);
                const last = keys[keys.length-1];
                keys.forEach(function(k) {
                    let amountMultiplier = parseFloat(takeProfit[k]) / 100;
                    let priceMultiplier = 1 + parseFloat(k)/100;
                    if (takeProfit.hasOwnProperty(k)) {
                        if (k===last) {
                            sellAll(bittrex, coin, coinPair, buyPrice * priceMultiplier)
                        } else {
                            sell(bittrex, coin, coinPair, totalSellAmount * amountMultiplier, buyPrice * priceMultiplier)
                        }
                    }
                })
            }
        });
    }
}

module.exports = seller;
