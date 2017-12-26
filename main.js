const SimpleTelegram = require('./simple-telegram')
const Bittrex = require('./bittrex')
const stg = new SimpleTelegram()

/**
 * Paths to bin and keys file to correctly launch telegram-cli
 * @type {string}
 */
const tgBinFile  = "tg/bin/telegram-cli"
const tgKeysFile = "tg/tg-server.pub"

/**
 * Bittrex settings
 * @see bittrex.js docs
 */
const API_KEY = ''
const SECRET = ''
const btcAmount = 0.01
const highestMarkup = 1.008
const takeProfit = {10: 70, 20: 30}
const closeTimeLimit = 90
assertSettings();

/**
 * Settings to correctly recognize the signal and find the currency+price
 * @type {RegExp}
 */
const signalGroupRegexp = /Signals group/
const signalKeywordRegexp = /buy/
const signalCurrencyRegexp = /^[\w]+/
const signalPriceRegexp = /0?\.\d+/

// Creating simpleTelegram object
stg.create(tgBinFile, tgKeysFile)

stg.getProcess().stdout.on("receivedMessage", function(msg) {
    if (isSignal(msg)) {
        console.log("Received signal! Processing...")
        processSignal(msg.content)
    }
})

/**
 * Extracting currency (BTC-XXX) and price and placing an order
 * @param s
 */
function processSignal(s) {
    const currency = s.match(signalCurrencyRegexp)[0]
    var price = s.match(signalPriceRegexp)[0]
    if (price.charAt(0) === ".") {
        price = 0 + price
    }
    if (currency && price) {
        new Bittrex(API_KEY, SECRET, btcAmount, highestMarkup, takeProfit, closeTimeLimit)
            .checkBalancesAndBuy(currency, parseFloat(price))
    } else {
        console.log("Could not find currency or price.")
    }
}

/**
 * Checks if the message is a signal or not
 * @param msg
 * @returns {boolean}
 */
function isSignal(msg) {
    if (msg.caller.match(signalGroupRegexp) && msg.content.match(signalKeywordRegexp)) {
        return true
    } else {
        return false
    }
}

/**
 * Checks if the settings are correct.
 */
function assertSettings() {
    if (API_KEY.length <= 0 || SECRET <= 0) {
        throw new Error("Please fill in the Bittrex API keys. Terminating...")
    }
    if (btcAmount > 0.5) {
        console.log("WARNING: You are using a lot of money for altcoin trading. Supervising the bot is recommended.")
    }
    if (highestMarkup > 1.1) {
        throw new Error("The markup is too high! Please set it to a lower value and try again. Terminating...")
    }
    var sum = 0
    Object.keys(takeProfit).forEach(function(k) {
        if (takeProfit.hasOwnProperty(k)) {
            sum += takeProfit[k];
        } else {
            throw new Error("The take-profit object has some values missing. Terminating...")
        }
        if (k > 50) {
            console.log("WARNING: Your take-profit steps are set to over 50%.")
        }
    })
    if (sum!=100) {
        throw new Error("The take-profit percentages must be set to give 100% together. Terminating...")
    }
    if (closeTimeLimit < 10 || closeTimeLimit > 900) {
        throw new Error("The close time limit must be between 10 and 900 seconds.")
    }
}
