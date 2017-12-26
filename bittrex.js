class bittrex {
    /**
     * @param API_KEY
     * @param SECRET
     * @param btcAmount how many BTC are u willing to spend on each signal
     * @param highestMarkup what is the highest markup to the signal you are wiling to set as a bid
     * @param takeProfit take-profit steps in percentages { profit : amount }
     * @param closeTimeLimit time in seconds how long to wait for the order to be closed before closing manually (MAX 900)
     */
    constructor(API_KEY, SECRET, btcAmount, highestMarkup, takeProfit, closeTimeLimit) {
        this.bittrex  = require('node-bittrex-api');
        this.bittrex.options({
            'apikey' : API_KEY,
            'apisecret' : SECRET
        });
        this.btcAmount = btcAmount;
        this.highestMarkup = highestMarkup;
        this.takeProfit = takeProfit;
        this.maxTries = closeTimeLimit/10;
        this.triesCounter = 0;
    }

    /**
     * Check balance of BTC, if available and the price is within the markup bound, place the buy order
     * @param currency
     * @param price
     */
    checkBalancesAndBuy(currency, price) {
        const that = this;
        this.bittrex.getbalance({ currency : 'BTC' }, function( data, err ) {
            if (err) {
                console.log("Balance retrieval error: " + err.message);
            }
            if (data) {
                if (data.result.Balance >= that.btcAmount) {
                    const currencyPair = `BTC-${currency}`;
                    that.bittrex.getorderbook({ market : currencyPair, type : "both"}, function( data, err ) {
                        if (err) {
                            console.log("Order book error: " + err.message)
                        }
                        if (data) {
                            const highestAsk = data.result.sell[0].Rate;
                            const maxPrice = price*that.highestMarkup;
                            if (maxPrice > highestAsk) {
                                if(!that.assertCoin(data.result.buy[0].Rate, maxPrice)) {
                                    console.log("The coin price differs too much from the signalled price! Possibly mistaken signal. Skipping.")
                                    return
                                }
                                that.buy(highestAsk, currencyPair, currency);
                            } else {
                                console.log("Asks are too high to buy for this price! Skipping this signal.")
                            }
                        }
                    });
                } else {
                    console.log("insufficient BTC")
                }
            }
        });
    }

    /**
     * Blind check if the signalled coin price is not mistaken
     * Does not allow to trade the coin if its price is lower than markup
     * True if the price seems ok, false if fail
     * @param highestBid
     * @param maxPrice
     * @returns {boolean}
     */
    assertCoin(highestBid, maxPrice) {
        return maxPrice / highestBid <= this.highestMarkup;
    }

    /**
     * Placing the buy order
     * @param buyPrice
     * @param currencyPair
     * @param currency
     */
    buy(buyPrice, currencyPair, currency) {
        const that = this;
        const amount = this.btcAmount / buyPrice;
        console.log(`===== PLACING LIMIT BUY ORDER (${currencyPair}) =====`);
        this.bittrex.buylimit({market : currencyPair, quantity : amount, rate : btcPrice}, function ( data, err ) {
            if (err) {
                console.log("Order LIMIT BUY error: " + err.message);
            }
            if (data) {
                console.log(new Date() + ` Placed order for ${amount} of ${currency} | Rate: ${$buyPrice} | Total BTC: ${amount*buyPrice} BTC |ID: ${data.result.uuid}`);
                that.waitForClosing(data.result.uuid, buyPrice, currencyPair, currency);
            }
        });
    }

    /**
     * Waiting until order is closed and sets the take-profits orders if so
     * If it is not closed within given time, the order gets closed manually
     * @param uuid
     * @param buyPrice
     * @param currencyPair
     * @param currency
     */
    waitForClosing(uuid, buyPrice, currencyPair, currency) {
        const that = this;
        this.bittrex.getorder({ uuid : uuid }, function (data, err) {
            if (err) {
                console.log("Order status error: " + err.message);
            }
            if (data) {
                if (data.result.IsOpen === true && that.triesCounter < that.maxTries) {
                    setTimeout(function() {
                        that.triesCounter++;
                        that.waitForClosing(uuid, buyPrice, currencyPair, currency);
                    }, 10000);
                } else if (data.result.IsOpen === true && that.triesCounter >= that.maxTries) {
                    that.closeOrder(data.result)
                } else if (data.result.IsOpen === false) {
                    that.checkBalanceAndSell(buyPrice, currencyPair, currency);
                } else {
                    throw new Error("Unexpected state of order. Terminating...");
                }
            }
        })
    }

    /**
     * @param order
     */
    closeOrder(order) {
        console.log(`Cancelling order ${order.uuid}`)
        this.bittrex.cancel({ uuid: order.uuid }, function( data, err ) {
            if (err) {
                console.log("Cancel order error: " + err.message);
            }
            if (data && data.success === true) {
                console.log(`Cancelled order ID ${order.OrderUuid}: ${order.Type} ${order.Exchange}`)
            }
        })
    }

    /**
     * Checks balance and places take-profit orders.
     * @param buyPrice
     * @param currencyPair
     * @param currency
     */
    checkBalanceAndSell(buyPrice, currencyPair, currency) {
        const that = this;
        this.bittrex.getbalance({ currency : currency }, function( data, err ) {
            if (err) {
                console.log("Balance retrieval error: " + err.message);
            }
            if (data) {
                const totalSellAmount = data.result.Balance;
                console.log(`===== PLACING TAKE-PROFIT ORDERS (${currencyPair}) =====`);
                const keys = Object.keys(that.takeProfit)
                const last = keys[keys.length-1]
                keys.forEach(function(k) {
                    let amountMultiplier = parseFloat(that.takeProfit[k]) / 100;
                    let priceMultiplier = 1 + parseFloat(k)/100;
                    if (that.takeProfit.hasOwnProperty(k)) {
                        if (k===last) {
                            that.sellAll(currency, currencyPair, buyPrice * priceMultiplier);
                        } else {
                            that.sell(currency, currencyPair, totalSellAmount * amountMultiplier, buyPrice * priceMultiplier);
                        }
                    }
                })
            }
        });
    }

    /**
     * Sell given amount of given coins for given price
     * @param currency
     * @param currencyPair
     * @param sellAmount
     * @param sellPrice
     */
    sell(currency, currencyPair, sellAmount, sellPrice) {
        this.bittrex.selllimit({market : currencyPair, quantity : sellAmount, rate : sellPrice}, function ( data, err ) {
            if (err) {
                console.log("Order LIMIT SELL error: " + err.message);
            }
            if (data) {
                console.log(new Date() + ` Placed order to sell ${sellAmount} of ${currency} | Rate: ${sellPrice} | Total BTC: ${sellAmount*sellPrice} BTC | ID: ${data.result.uuid}`);
            }
        });
    }

    /**
     * Sell all of the current balance
     * @param currency
     * @param currencyPair
     * @param sellPrice
     */
    sellAll(currency, currencyPair, sellPrice) {
        const that = this;
        this.bittrex.getbalance({ currency : currency }, function( data, err ) {
            if (err) {
                console.log("Balance retrieval error: " + err.message);
            }
            if (data) {
                const totalSellAmount = data.result.Balance;
                that.sell(currency, currencyPair, totalSellAmount, sellPrice)
            }
        });
    }
}

module.exports = bittrex;
