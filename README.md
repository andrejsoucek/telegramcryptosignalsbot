# Crypto signals trading bot
Trading altcoins on Bittrex based on signals received on your Telegram.

## Pre-requisities
The [simple-telegram](https://github.com/GuillermoPena/simple-telegram) library used in this project is based on [vysheng’s telegram-cli project](https://github.com/vysheng/tg). You have to install and configure this great project before using simple-telegram. You can obtain every info that you need in [vysheng’s repository](https://github.com/vysheng/tg).

## Settings
The initial settings is done through the parameters in main.js
### Telegram settings
```javascript
const tgBinFile  = "tg/bin/telegram-cli" // path to the telegram-cli file
const tgKeysFile = "tg/tg-server.pub"    // path to the telegram keys file
```
### Signals settings (regexps)
```javascript
const signalGroupRegexp = /Signals group/      // regexp for the group name to read from
const signalKeywordRegexp = /buy/              // regexp for filtering the signal
const signalCurrencyRegexp = /^[\w]+/          // regexp to retrieve which coin is signalled to buy
const signalPriceRegexp = /0?\.\d+/            // regexp to retrieve the signalled price which to buy for

```
### Trades settings
```javascript
const API_KEY = 'BITTREX API KEY'
const SECRET = 'BITTREX SECRET'
const btcAmount = 0.01              // 0.01 BTC will be spend on every signal
const highestMarkup = 1.008         // if the price will go higher than 0.8% before placing the order, the signal will be ignored
const takeProfit = {10: 70, 20: 30} // 70% of coins will be sold with 10% profit, 30% will be sold with 20% profit - you can make more take-profit steps
const closeTimeLimit = 90           // if the order is not closed (filled) after 90 second, it gets cancelled and the signal will be ignored
```
## Run
```
node main.js
```

## Donations
Feel free to send me a donation to one of these wallets:

BTC: 14YXBoR4XTT1jzawQpYLdoKYhtK45LHMsi

LTC: LTX5PTZ4zFpsSDw5US2TvVFs9cmXyKfUbe

ETH: 0xb0fddc094f81406870191d728a656d4f3c439210

#### PRs for more exchanges are welcome
