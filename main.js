const SimpleTelegram = require('./simple-telegram');
const WatchDog = require('./bittrex/watchdog');
const Signal = require('./signal');
const log = require('./log');
const config = require('config');
const stg = new SimpleTelegram();

/**
 * Configuration load and check
 */
const trexCfg = config.get('Exchange').bittrex;
const tradesCfg = config.get('Trading');
const pbCfg = config.get('Pushbullet');
assertSettings(trexCfg, tradesCfg, pbCfg);

/**
 * Settings to correctly recognize the signal and find the currency+price
 */
const signalsRegexpCfg = config.get('Signals').regexp;
const signalGroupRegexp = new RegExp(signalsRegexpCfg.group);
const signalKeywordRegexp = new RegExp(signalsRegexpCfg.keyword, "i");
const signalCoinRegexp = new RegExp(signalsRegexpCfg.coin.regexp);
const signalPriceRegexp = new RegExp(signalsRegexpCfg.price.regexp);
const skipKeywordRegexp = new RegExp(signalsRegexpCfg.skipKeyword, "i");

// Creating watch dog
const wd = new WatchDog(trexCfg, tradesCfg);

// Creating simpleTelegram object
const tgCfg = config.get('Telegram');
stg.create(tgCfg.binFile, tgCfg.keysFile);
// stg.setTelegramDebugFile("telegram.log");
stg.getProcess().stdout.on("receivedMessage", function(msg) {
    if (isSignal(msg)) {
        log("INFO", "==============================");
        log("INFO", "Received signal! Processing...");
        log("INFO", msg.caller + ": " + msg.content);
        if (signalsRegexpCfg.skipKeyword.length > 0 && skipSignal(msg.content)) {
            log("WARNING", "Regexp matched a skip keyword. Skipping this signal.");
            return
        }
        wd.processSignal(parseSignal(msg.content))
    }
});

/**
 * Extracting signalled coin (BTC-XXX) and price
 * @param s
 */
function parseSignal(s) {
    const matchPrice = s.match(signalPriceRegexp);
    const matchCoin = s.match(signalCoinRegexp);
    if (matchPrice && matchCoin) {
        let price = signalsRegexpCfg.price.capturingGroup === true ? matchPrice[1] : matchPrice[0];
        const coin = signalsRegexpCfg.coin.capturingGroup ===  true ? matchCoin[1] : matchCoin[0];
        if (price.charAt(0) === ".") {
            price = 0 + price
        }
        log("INFO", "Signal parsed successfully...");
        return new Signal(coin, parseFloat(price))
    } else {
        log("ERROR", "Could not find coin or price. Skipping this signal.")
    }
}


/**
 * Checks if the message matches the skipKeywordRegexp or not
 * @param s
 * @returns {boolean}
 */
function skipSignal(s) {
    return skipKeywordRegexp.test(s)
}

/**
 * Checks if the message is a signal or not
 * @param msg
 * @returns {boolean}
 */
function isSignal(msg) {
    return signalGroupRegexp.test(msg.caller) && signalKeywordRegexp.test(msg.content)
}

/**
 * Checks if the settings are correct.
 */
function assertSettings(trexCfg, tradesCfg, pbCfg) {
    if (trexCfg.apiKey.length <= 0 || trexCfg.apiSecret.length <= 0) {
        throw new Error("Please fill in the Bittrex API keys. Terminating...")
    }
    if (tradesCfg.btcAmount === "all") {
        log("WARNING", "You are using all of your BTC balance for altcoin trading. Supervising the bot is recommended.")
    }
    if (tradesCfg.btcAmount > 0.5) {
        log("WARNING", "You are using a lot of money for altcoin trading. Supervising the bot is recommended.")
    }
    if (tradesCfg.highestMarkup > 1.1) {
        throw new Error("The markup is too high! Please set it to a lower value and try again. Terminating...")
    }
    if (Object.keys(tradesCfg.takeProfit).length > 0) {
        let sum = 0;
        Object.keys(tradesCfg.takeProfit).forEach(function(k) {
            if (tradesCfg.takeProfit.hasOwnProperty(k)) {
                sum += tradesCfg.takeProfit[k];
            } else {
                throw new Error("The take-profit object has some values missing. Terminating...")
            }
            if (k > 50) {
                log("WARNING", "Your take-profit steps are set to over 50%.")
            }
        });
        if (sum!=100) {
            throw new Error("The take-profit percentages must be set to give 100% together. Terminating...")
        }
    } else {
        log("WARNING", "The take-profit object is empty. Consider using it to automate the trading process.")
    }
    if (tradesCfg.closeTimeLimit < 10 || tradesCfg.closeTimeLimit > 900) {
        throw new Error("The close time limit must be between 10 and 900 seconds.")
    }
    if (pbCfg.notify === true) {
        if (!pbCfg.accessToken.length > 0) {
            throw new Error("The Pushbullet access token must be filled in order to receive notifications. Terminating...")
        }
        if (!validateEmail(pbCfg.email)) {
            throw new Error("The Pushbullet email field needs to be filled correctly in order to receive notifications. Terminating...")
        }
    } else {
        log("WARNING", "Pushbullet notifications are disabled. Consider using them to know what the bot is doing.")
    }
}

function validateEmail(email) {
    const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}
