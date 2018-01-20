const log = require('../log')

class buyer {

    constructor(bittrex, tradesCfg) {
        this.bittrex = bittrex
        this.btcAmount = tradesCfg.btcAmount
        this.highestMarkup = tradesCfg.highestMarkup
        this.takeProfit = tradesCfg.takeProfit
        this.maxTries = tradesCfg.closeTimeLimit / 10
        this.triesCounter = 0
    }

    /**
     * Check balance of BTC, if available and the price is within the markup bound, place the buy order
     * @param coin
     * @param price
     * @param onOrderFilled
     */
    checkBalanceAndBuy(coin, price, onOrderFilled) {
        const that = this;

        this.bittrex.getbalance({ currency : 'BTC' }, function( data, err ) {
            if (err) {
                log("ERROR", "Balance retrieval error: " + err.message)
            }
            if (data) {
                checkPriceAndBuy(data.result)
            }
        });

        var checkPriceAndBuy = function(result) {
            if (result.Balance >= that.btcAmount) {
                const coinPair = `BTC-${coin}`
                that.bittrex.getorderbook({ market : coinPair, type : "both"}, function( data, err ) {
                    if (err) {
                        log("ERROR", "Order book error: " + err.message)
                    }
                    if (data) {
                        const lowestAsk = data.result.sell[0].Rate
                        const highestBid = data.result.buy[0].Rate
                        const maxPrice = price*that.highestMarkup
                        if (maxPrice > lowestAsk) {
                            // if lowestAsk is 5% lower than the signalled one, the order will not be placed
                            if (percentageChange(lowestAsk, price) < -5) {
                                log("WARNING", "The coin price differs too much from the signalled price! Possibly mistaken signal. Skipping.")
                                log("WARNING", `Signalled price: ${price}, Current lowest ask: ${lowestAsk}, highest bid: ${highestBid}`)
                                return
                            }
                            buy(lowestAsk, coinPair, coin)
                        } else {
                            log("WARNING", "Asks are too high to buy for this price! Skipping this signal.")
                            log("WARNING", `Signalled price: ${price}, max price: ${maxPrice}. Current lowest ask: ${lowestAsk}, highest bid: ${highestBid}`)
                        }
                    }
                })
            } else {
                log("ERROR", `Not enough funds. Cannot buy any ${coin}. Skipping this signal...`)
            }
        }

        var percentageChange = function(lowestAsk, price) {
            return (lowestAsk - price)/price*100
        }

        var buy = function(buyPrice, coinPair, coin) {
            const that = this;
            const amount = that.btcAmount / buyPrice;
            log("INFO", `===== PLACING LIMIT BUY ORDER (${coinPair}) =====`)
            this.bittrex.buylimit({market : coinPair, quantity : amount, rate : buyPrice}, function ( data, err ) {
                if (err) {
                    log("ERROR", "Order LIMIT BUY error: " + err.message)
                }
                if (data) {
                    log("INFO", new Date() + ` Placed order to buy ${amount} of ${coin} | Rate: ${buyPrice} | Total BTC: ${amount*buyPrice} BTC | ID: ${data.result.uuid}`, true)
                    waitForClosing(data.result.uuid, buyPrice, coinPair, coin)
                }
            });

            var waitForClosing = function(uuid, buyPrice, coinPair, coin) {
                const that = this;
                that.bittrex.getorder({ uuid : uuid }, function (data, err) {
                    if (err) {
                        log("WARNING", "Order status error: " + err.message)
                    }
                    if (data) {
                        if (data.result.IsOpen === true && that.triesCounter < that.maxTries) {
                            setTimeout(function() {
                                that.triesCounter++
                                waitForClosing(uuid, buyPrice, coinPair, coin)
                            }, 10000)
                        } else if (data.result.IsOpen === true && that.triesCounter >= that.maxTries) {
                            log("WARNING", new Date() + ` Order not filled within ${that.closeTimeLimit}. Closing...`, true)
                            closeOrder(data.result)
                        } else if (data.result.IsOpen === false) {
                            if (Object.keys(that.takeProfit).length > 0) {
                                log("INFO", new Date() + "Order filled.", true)
                                onOrderFilled(buyPrice, coinPair, coin, that.takeProfit);
                            } else {
                                log("INFO", "Take profit settings empty, nothing to do, waiting for another signal...")
                            }
                        } else {
                            throw new Error("Unexpected state of order. Terminating...")
                        }
                    }
                })
            }

            var closeOrder = function(order) {
                const that = this
                that.bittrex.cancel({ uuid: order.uuid }, function( data, err ) {
                    if (err) {
                        log("ERROR", "Close order error: " + err.message)
                    }
                    if (data && data.success === true) {
                        log("INFO", `Closed order ID ${order.OrderUuid}: ${order.Type} ${order.Exchange}`)
                    }
                })
            }
        }
    }
}

module.exports = buyer
