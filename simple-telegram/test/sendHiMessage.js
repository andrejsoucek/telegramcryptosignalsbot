var SimpleTelegram = require('/home/guiller/code/simple-telegram/lib/simpletelegram.js')
var stg = new SimpleTelegram()

// Replace next values to your own paths
var tgBinFile  = "/home/guiller/code/obedience/bin/telegram-cli"
var tgKeysFile = "/home/guiller/code/obedience/bin/tg-server.pub"

// Preparing Winston logger
var winston = require('winston')
var logfile = '/home/guiller/code/simple-telegram/test/loggerTest.log'

// Define options for Date#toLocaleTimeString call we will use.
var twoDigit = '2-digit';
var options = {
  day: twoDigit,
  month: twoDigit,
  year: twoDigit,
  hour: twoDigit,
  minute: twoDigit,
  second: twoDigit
};

function formatter(args) {
  var dateTimeComponents = new Date().toLocaleTimeString('en-ES', options).split(',');
  var logMessage = '[' + dateTimeComponents[0] + dateTimeComponents[1] + '][' + args.level + '] - ' + args.message;
  return logMessage;
}

var logger = new winston.Logger({
    transports: [ new (winston.transports.File)({ filename: logfile
                                                , timestamp: true
                                                , json: false
                                                , formatter: formatter
                                                })
                , new (winston.transports.Console)()
                ]
  })

// Creating simpleTelegram object
stg.addLogger(logger)
stg.create(tgBinFile, tgKeysFile)

// Sending Message
setTimeout(function() {
  stg.send("Guillermo", "Hi!")
  setTimeout(function() { stg.quit() }, 5000)
}, 5000)
