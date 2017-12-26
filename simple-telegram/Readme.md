# Simple-Telegram

Allow your programs to talk to you by Telegram



## Pre-requisites


Simple-telegram is based in [vysheng’s telegram-cli project](https://github.com/vysheng/tg). You must install and configure this great project previously to use simple-telegram. You can obtain every info that you need in [vysheng’s repository](https://github.com/vysheng/tg).

Also, you must install nodeJs 0.10 or above. You can check more info [here](http://www.nodejs.org).



##Installation

Easy. If you use npm (recommended):

	npm install simple-telegram

If you prefer git:

	git clone https://github.com/GuillermoPena/simple-telegram.git

Simple-telegram has been tested in Ubuntu 14.04 and Raspberry Pi with Raspbmc.
This doesn’t mean that simple-telegram doesn’t work in other systems… try it!



##How to use it

Simple-telegram allows send and receive messages by Telegram so, how do it?

1. Sending a message:

	Using ‘send’ public method
	Sintaxis: tg.send(userName, message)
	Example:
	```javascript
	var SimpleTelegram = require('simple-telegram')
	var stg = new SimpleTelegram()

	// Replace next values to your own paths
	var tgBinFile  = "[your path]/telegram-cli"
	var tgKeysFile = "[your path]/tg-server.pub"

	// Creating simpleTelegram object
	stg.create(tgBinFile, tgKeysFile)

	stg.send("John", "Hi John!")
	```



2. Receiving a message:

	Catching ‘receivedMessage’ event, which provide you a object like this:
		msg = { “caller”:”John”; “content”: “Hi”; "command": "Hi"; "args":"" }
	Example:

	```javascript
	var SimpleTelegram = require('simple-telegram')
	var stg = new SimpleTelegram()

	// Replace next values to your own paths
	var tgBinFile  = "[your path]/telegram-cli"
	var tgKeysFile = "[your path]/tg-server.pub"

	// Creating simpleTelegram object
	stg.create(tgBinFile, tgKeysFile)

	stg.getProcess().stdout.on("receivedMessage", function(msg) {
	    console.log("\nReceived message")
	    console.dir(msg)
	})
	```

3. Send and receive a message from another program with socket.io...
   ...and other optionals functions.

	Server side:

	```javascript
	var SimpleTelegram = require('simple-telegram')
	var stg = new SimpleTelegram()

	// Replace next values to your own paths
	var tgBinFile  = "[your path]/telegram-cli"
	var tgKeysFile = "[your path]/tg-server.pub"

	// Creating simpleTelegram object
	var options = '-vv'	// Extra telegram option (more verbose output)

	// If you want send messages from another program, you must specify a port
	stg.setSocketPort(3008)

	// You can add one or more loggers (winston loggers) to files, DBs.. etc
	stg.addLogger(logger)

	// Also, you can set a debug file for telegram process
	stg.setTelegramDebugFile(tgDebugfile)

	// Launching telegram process
	stg.create(tgBinFile, tgKeysFile, options)
	```

	Client side:

	```javascript
	var io      = require('socket.io/node_modules/socket.io-client')
	var socket  = io.connect( 'http://localhost:' + port) // Port of server side

	socket.on('connect', function(){
		console.log("Connected!")
		socket.on('disconnect', function(){
			console.log('Disconnected!')
			return 0
		})

		// 'to' is a Telegram-cli contact
		var message = { "from":"Test", "to":"Customer", "content":"Hi" }
		console.log("Sending message...")
		console.dir(message)
		socket.emit('message', message)
	})
	```

## Contributors

- [GuillermoPena](http://github.com/GuillermoPena)
