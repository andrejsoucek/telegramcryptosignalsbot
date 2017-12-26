// Server side

var SimpleTelegram = require('/home/guiller/code/simple-telegram/lib/simpletelegram.js')
var stg = new SimpleTelegram()

// Replace next values to your own paths
var tgBinFile  = "/home/guiller/code/telegram-cli/telegram-cli"
var tgKeysFile = "/home/guiller/code/telegram-cli/tg-server.pub"

// Preparing Winston logger
var winston  = require('winston')
var logfile  = '/home/guiller/code/simple-telegram/test/loggerTest.log'

// Define options for Date#toLocaleTimeString call we will use.
var d2 = '2-digit';
var options = { day: d2, month: d2, year: d2, hour: d2, minute: d2, second: d2 }

function formatter(args) {
  var dateTimeComponents = new Date().toLocaleTimeString('en-US', options).split(',');
  var logMessage = '[' + dateTimeComponents[0] + dateTimeComponents[1] + '][' + args.level + '] - ' + args.message;
  return logMessage;
}

var logger = new winston.Logger({
    transports: [ new (winston.transports.File)({ filename: logfile
                                                , timestamp: true
                                                , json: false
                                                , formatter: formatter
                                                , level: "debug"
                                                })
                , new (winston.transports.Console)( {level: "debug"} )
                ]
  })

// Creating simpleTelegram object
var tgDebugfile = '/home/guiller/code/simple-telegram/test/telegram-cli.log'
var options = '-vv'
stg.setSocketPort(3008)
stg.addLogger(logger)
stg.setTelegramDebugFile(tgDebugfile)
stg.create(tgBinFile, tgKeysFile, options)
