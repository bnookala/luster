var app = require('http').createServer(requestHandler).listen(1337);
var fs = require('fs');
var path = require('path');
var io = require('socket.io').listen(app);

function requestHandler (request, response) {
	console.log('request starting...');

	var filePath = '.' + request.url;
	if (filePath == './') {
		filePath = './index.html';
	}

	var extname = path.extname(filePath);
	var contentType = 'text/html';

	switch (extname) {
		case '.js':
			contentType = 'text/javascript';
			break;
		case '.css':
			contentType = 'text/css';
			break;
	}

	// Check if the file path exists, and run a callback.
	path.exists(filePath, function (exists) {
		if (exists) {
			fs.readFile(filePath, function(error, content) {
				if (error) {
					response.writeHead(500);
					response.end();
				} else {
					response.writeHead(200, { 'Content-Type': contentType });
					response.end(content, 'utf-8');
				}
			});
		} else {
			response.writeHead(404);
			response.end();
		}
	});
}

io.sockets.on('connection', function (socket) {
	var test = [
		{id: 1, r: 244, g: 200, b: 200}
	]
	socket.emit('test', test);
});

setInterval(testColorChange, 250);

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
