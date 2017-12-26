// Client side

var io      = require('socket.io/node_modules/socket.io-client')
var socket  = io.connect( 'http://localhost:3008')

socket.on('connect', function(){
	console.log("Connected!")
	socket.on('disconnect', function(){
		console.log('Disconnected!')
		return 0
	})

	var message = { "from":"Test", "to":"Guillermo", "content":"Hola"}
	console.log("Sending message...")
	console.dir(message)
	socket.emit('message', message)
})
