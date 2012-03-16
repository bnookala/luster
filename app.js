var express = require('express');
var zmq = require('zmq'); 
var app = express.createServer().listen(1337, '0.0.0.0');
var io = require('socket.io').listen(app);

var zmqSocket = zmq.socket('req');
zmqSocket.connect('tcp://10.12.5.212:8080');

app.use(express.static(__dirname + '/static'));
app.use(express.bodyParser());

app.get('/', function (request, response) {
	response.render('view/index.html');
});

io.sockets.on('connection', function (socket) {
	socket.on('draw', function (datagram) {
		var stringified = JSON.stringify(datagram);
		zmqSocket.send(stringified);
	});
});
