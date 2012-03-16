var express = require('express');
var app = express.createServer().listen(1337);
var io = require('socket.io').listen(app);

app.use(express.static(__dirname + '/static'));

app.get('/', function (request, response) {
	response.render('view/index.html');
});

app.post('/', function (request, response) {
	console.log(request);
});

io.sockets.on('connection', function (socket) {
	var interval = undefined;
	socket.on('start-test', function (data) {
		interval = setInterval(testColorChange, 250);
	});

	socket.on('stop-test', function (socket) {
		clearInterval(interval);
	});
});

function testColorChange () {
	var test = [];
	var random = Math.floor(Math.random() * 49);
	for (var i=0; i < random; i++) {
		var obj = {
			id: i,
			r: Math.floor(Math.random() * 256),
			g: Math.floor(Math.random() * 256),
			b: Math.floor(Math.random() * 256)
		}
		test.push(obj);
	}
	io.sockets.emit('test', test);
}
