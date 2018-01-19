# Crypto signals trading bot
Trading altcoins on Bittrex based on signals received on your Telegram.

## Installation
1. Clone this repo incl. submodules.
```
git clone --recursive https://github.com/andrejsoucek/telegramcryptosignalsbot.git
```
2. Install telegram-cli.
```
cd tg
./configure && make
bin/telegram-cli //try to run it and connect
cd ..
```
3. Install simple-telegram
```
cd simple-telegram
npm install
cd ..
```
4. Install this project
```
npm install
```
5. Run
```
node main.js
```

## Settings
The initial settings is done through the config/default.json file
```json
{
   "Telegram": {
      "binFile": "tg/bin/telegram-cli",
      "keysFile": "tg/tg-server.pub"
   },
   "Exchange": {
      "bittrex": {
         "apiKey": "",
         "apiSecret": ""
      }
   },
   "Trading": {
      "btcAmount": 0.01,
      "highestMarkup": 1.008,
      "takeProfit": { "10": 70, "20": 30 },
      "closeTimeLimit": 90
   },
   "Signals": {
         "regexp": {
            "group": "Signals group",
            "keyword": "buy",
            "coin": "^[\\w]+",
            "price": "0?\\.\\d+",
            "skipKeyword": "risk"
         }
   }
}
```
### Telegram settings
* binFile - path to the telegram-cli file
* keysFile - path to the telegram keys file
### Exchange settings (regexps)
#### bittrex
-settings for Bittrex exchange (currently the only one available)
* apiKey - bittrex api key
* apiSecret - bittrex api secret
### Trading settings
* btcAmount - how much BTC will be spend on every signal
* highestMarkup - if the price is higher than {signalled price * highestMarkup} before placing the order, the signal will be ignored
* takeProfit - { "X": Y } Y of coins will be sold at X profit, you can make more take-profit steps (empty object = no sell orders)
* closeTimeLimit - if the order is not closed (filled) within the time limit, it gets cancelled and the signal is ignored
### Signals settings
#### regexp
signal and attributes recognition

NOTE: Special characters need to be escaped to meet the JSON requirements!
* group - regexp for the group name to read from
* keyword - regexp for filtering the signal
* coin - regexp to retrieve which coin is signalled to buy
* price - regexp to retrieve the signalled price which to buy for
* skipKeyword - regexp to filter signals, skipping the signal if the regexp matches (leave blank if you do not want to skip any signal)


## TODO
* Watch the price of bought coins to make the take-profit orders conditional - the goal is to have stop-loss and take-profit orders opened automatically
* Push notifications (probably Pushbullet integration)
* More exchanges

## Donations
Feel free to send me a donation to one of these wallets:

BTC: 14YXBoR4XTT1jzawQpYLdoKYhtK45LHMsi

LTC: LTX5PTZ4zFpsSDw5US2TvVFs9cmXyKfUbe

ETH: 0xb0fddc094f81406870191d728a656d4f3c439210

#### PRs for more exchanges are welcome
