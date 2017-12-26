/* ___________________________________________________________________________

 Module: simpletelegram.js   Version: v0.0.13
 Repository: http://github.com/GuillermoPena/obedience
 Author: Guillermo Peña (guillermo.pena.cardano@gmail.com)
 Last update: 19/05/2015

 Simple-Telegram object (Telegram communicator object)

 __________________________________________________________________________*/

function SimpleTelegram() {

    // __ Modules ____________________________________________________________

    var fs     = require('fs')
    var server = require('http').createServer()
    var io     = require('socket.io')(server)

    // __ Properties _________________________________________________________

    var telegramProcess // Telegram cli process
    var loggers = []    // Loggers array
    var tgBinFile       // Telegram binary file
    var tgKeysFile      // Telegram keys file
    var tgDebugFile     // Telegram debug log file
    var extraOptions    // Telegram extra options

    // __ Private Methods ____________________________________________________

    // Logging messages
    var log = function(level, message) {
        if (loggers.length == 0) {
            if (level.toLowerCase() == "error")
                console.error(message)
            else
                console.log(message)
        } else {
            loggers.forEach(function(logger) {
                logger.log(level, message)
            })
        }
    }

    // Set socket.io interface
    var setSocketIo = function() {

        // When a sockect is connected
        io.on('connection', function(socket){
            log('debug', 'Socket id [' + socket.id + '] connected')
            var endpoint = socket.handshake.address

            // When a sockect is disconnected
            socket.on('disconnect', function () {
                log('debug', 'Socket id [' + socket.id + '] disconnected')
            })

            // When a message is sent
            socket.on('message', function (message) {
                log('debug', 'Socket.io:' + socket.id
                    + ": Message from '" + message.from + '" to "'
                    + message.to + '": ' + message.content)
                send(message.to, message.content)
            })
        })
    }

    // Extract data from Telegram message (caller, command, arguments...)
    var receiveMessage = function(message){
        if (tgDebugFile) fs.appendFileSync(tgDebugFile, message)
        var index1 = message.toString().indexOf(">>>")
        var index2 = message.toString().indexOf("»»»")
        if (index1 <= -1 && index2 <= -1) return null

        // Extracting caller
        message = message.split('\n')[0]
        if (index1 > -1) {
            var slicesA = message.split('>>>')
        } else {
            var slicesA = message.split('»»»')
        }
        var slicesB = slicesA[0].split(']')
        var caller  = slicesA[0].replace(slicesB[0],"").replace(']','').trim()
        var content = null
        var cmd = null
        var args = null
        if (slicesA.length > 1) {
            content = slicesA[1].trim()

            // Extracting command
            var command = slicesA[1].trim()
            var slicesD = command.split(' ')
            cmd = slicesD[0].trim()

            // Extracting arguments
            args = command.replace(slicesD[0],"").trim()
        }

        // Emitting event
        parsedMessage = { "caller" : caller
            , "content": content
            , "command" : cmd
            , "args" : args
        }
        // Emitting event to process command
        // log('info', parsedMessage.caller + ' >>> Me : ' + parsedMessage.content)
        // fixing https://github.com/GuillermoPena/simple-telegram/issues/5 idk why it works this way
        setTimeout(function() {
            telegramProcess.stdout.emit('receivedMessage', parsedMessage)
        }, 100)
    }

    // Run Telegram process
    var runTelegram = function() {
        var options = ['-Ck', tgKeysFile].concat(extraOptions)
        telegramProcess = require('child_process').execFile(tgBinFile, options)
        telegramProcess.stdout.on('data', receiveMessage) // Receiving message
        log('debug', 'Simple-Telegram: Telegram-cli proccess is running')
        log('debug', 'Simple-Telegram: Waiting messages...')

        // Catching wrong exit codes or signals
        telegramProcess.on('uncaughtException', function(ex) {
            log('info', 'EXCEPTION - ' + ex)
            runTelegram()
        })
        telegramProcess.on('close', function(code, signal) {
            if (code != '0') log('info', 'CLOSE - Code: ' + code + ' - Signal: ' + signal)
            runTelegram()
        })
        telegramProcess.on('exit', function(code, signal) {
            if (code != '0') log('info', 'EXIT - Code: ' + code + ' - Signal: ' + signal)
            runTelegram()
        })
    }

    // __ Public Methods _____________________________________________________

    // Create and launch Telegram cli process
    var create = function(binFile, keysFile, options) {

        // Checking arguments
        var checkArgs = true
        if (!fs.existsSync(binFile) || !fs.statSync(binFile).isFile()) {
            log('error', 'Simple-Telegram: Telegram-cli binary file is not found [' + binFile + ']')
            checkArgs = false
        }
        if (!fs.existsSync(keysFile) || !fs.statSync(keysFile).isFile()) {
            log('error', 'Simple-Telegram: Telegram keys file is not found [' + keysFile + ']')
            checkArgs = false
        }

        // Running Telegram-cli
        if (checkArgs) {
            tgBinFile = binFile
            tgKeysFile = keysFile
            extraOptions = options
            runTelegram()
        }
    }

    // Send Message to someone in Telegram
    var send = function(target, message, logLevel) {

        // Checking if message contains something
        if (!message) return

        // Checking if Telegram-cli is running
        if (!telegramProcess) {
            log('error', 'Simple-Telegram: Error sending message. Telegram-cli proccess is not running')
            return
        }

        // if target contains something...
        if (target) {

            // Replacing blancks in target and some special characters in message
            target  = target.replace(' ','_')
            var newline = message.indexOf("\n")
            while (newline != -1) {
                message = message.replace("\n", "\\n")
                newline = message.indexOf("\n")
            }

            // Checkin log level
            var level = (logLevel || 'info')

            // Sendind message to Telegram-cli process
            log(level, 'Me >>> ' + target + ' : ' + message)
            telegramProcess.stdin.write('msg ' + target + ' "' + message + '"' + '\n', encoding='utf8')
        }
    }

    // Set telegram debug logfile
    var setTelegramDebugFile = function(filename) {
        tgDebugFile = filename
        log('debug', "Telegram debug file: " + filename)
    }

    // Set socket.io port
    var setSocketPort = function(port) {
        io.listen(port)
        log('debug', "Socket.io interface ready in port " + port)
    }

    // Getters and Setters
    var getProcess = function()  { return telegramProcess }

    // Add logger to array
    var addLogger = function(logger) { loggers.push(logger) }

    // Remove logger from array
    var removeLogger = function(logger) {
        var idx = loggers.indexOf(logger)
        if (idx != -1) loggers.splice(idx, 1)
    }

    // Exit
    var quit = function() {
        if (telegramProcess) {
            log('info', "Exitting from Telegram")
            telegramProcess.stdin.write('safe_quit' + '\n')
        }
    }

    // __ Return _____________________________________________________________

    return { "create": create
        , "send": send
        , "setTelegramDebugFile": setTelegramDebugFile
        , "setSocketPort": setSocketPort
        , "getProcess": getProcess
        , "addLogger" : addLogger
        , "removeLogger" : removeLogger
        , "quit": quit
    }
}

module.exports = SimpleTelegram
