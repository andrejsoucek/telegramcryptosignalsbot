const log = require('../log');

class buyer {

    constructor(bittrex, tradesCfg) {
        this.bittrex = bittrex;
        this.btcAmount = tradesCfg.btcAmount;
        this.highestMarkup = tradesCfg.highestMarkup;
        this.takeProfit = tradesCfg.takeProfit;
        this.maxTries = tradesCfg.closeTimeLimit / 10;
        this.triesCounter = 0
    }

    /**
     * Check balance of BTC, if available and the price is within the markup bound, place the buy order
     * @param coin
     * @param price
     * @param onOrderFilled
     */
    checkBalanceAndBuy(coin, price, onOrderFilled) {

        const checkPriceAndBuy = function(self, balance) {
            if (self.btcAmount === "all") {
                self.btcAmount = balance
            }
            if (balance >= self.btcAmount) {
                const coinPair = `BTC-${coin}`;
                self.bittrex.getorderbook({ market : coinPair, type : "both"}, (data, err) => {
                    if (err) {
                        log("ERROR", "Order book error: " + err.message)
                    }
                    if (data) {
                        const lowestAsk = data.result.sell[0].Rate;
                        const highestBid = data.result.buy[0].Rate;
                        const maxPrice = price*this.highestMarkup;
                        if (maxPrice > lowestAsk) {
                            const percentageChange = (lowestAsk, price) => (lowestAsk - price) / price * 100;
                            // if lowestAsk is 5% lower than the signalled one, the order will not be placed
                            if (percentageChange(lowestAsk, price) < -5) {
                                log("WARNING", "The coin price differs too much from the signalled price! Possibly mistaken signal. Skipping.");
                                log("WARNING", `Signalled price: ${price}, Current lowest ask: ${lowestAsk}, highest bid: ${highestBid}`);
                                return
                            }
                            buy(self, lowestAsk, coinPair, coin)
                        } else {
                            log("WARNING", "Asks are too high to buy for this price! Skipping this signal.");
                            log("WARNING", `Signalled price: ${price}, max price: ${maxPrice}. Current lowest ask: ${lowestAsk}, highest bid: ${highestBid}`)
                        }
                    }
                })
            } else {
                log("ERROR", `Not enough funds. Cannot buy any ${coin}. Skipping this signal...`)
            }
        };

        const buy = function(self, buyPrice, coinPair, coin) {

            const closeOrder = function(self, order) {
                self.bittrex.cancel({ uuid: order.uuid }, (data, err) => {
                    if (err) {
                        log("ERROR", "Close order error: " + err.message)
                    }
                    if (data && data.success === true) {
                        log("INFO", `Closed order ID ${order.OrderUuid}: ${order.Type} ${order.Exchange}`)
                    }
                })
            };

            const waitForClosing = function(self, uuid, buyPrice, coinPair, coin) {
                self.bittrex.getorder({ uuid : uuid }, function (data, err) {
                    if (err) {
                        log("WARNING", "Order status error: " + err.message)
                    }
                    if (data) {
                        if (data.result.IsOpen === true && self.triesCounter < self.maxTries) {
                            setTimeout(function() {
                                self.triesCounter++;
                                waitForClosing(uuid, buyPrice, coinPair, coin)
                            }, 10000)
                        } else if (data.result.IsOpen === true && self.triesCounter >= self.maxTries) {
                            log("WARNING", ` Order not filled within ${self.closeTimeLimit}. Closing...`, true);
                            closeOrder(self, data.result)
                        } else if (data.result.IsOpen === false) {
                            if (Object.keys(self.takeProfit).length > 0) {
                                log("INFO", "Order filled.", true);
                                onOrderFilled(buyPrice, coinPair, coin, self.takeProfit);
                            } else {
                                log("INFO", "Take profit settings empty, nothing to do, waiting for another signal...")
                            }
                        } else {
                            throw new Error("Unexpected state of order. Terminating...")
                        }
                    }
                })
            };

            const amount = self.btcAmount / buyPrice;
            log("INFO", `===== PLACING LIMIT BUY ORDER (${coinPair}) =====`);
            self.bittrex.buylimit({market : coinPair, quantity : amount, rate : buyPrice}, (data, err) =>{
                if (err) {
                    log("ERROR", "Order LIMIT BUY error: " + err.message)
                }
                if (data) {
                    log("INFO", ` Placed order to buy ${amount} of ${coin} | Rate: ${buyPrice} | Total BTC: ${amount*buyPrice} BTC | ID: ${data.result.uuid}`, true);
                    waitForClosing(self, data.result.uuid, buyPrice, coinPair, coin)
                }
            });
        };

        const self = this;
        this.bittrex.getbalance({ currency : 'BTC' }, function( data, err ) {
            if (err) {
                log("ERROR", "Balance retrieval error: " + err.message)
            }
            if (data) {
                checkPriceAndBuy(self, data.result.Balance)
            }
        });
    }
}

module.exports = buyer;
