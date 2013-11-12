var app = require('http').createServer(handler);
var io = require('socket.io').listen(app);
var fs = require('fs');
var redis = require("redis");
var client = redis.createClient();

io.set('log level', 1);

app.listen(8080);

function handler(req, res) {}

var nbUpdates = 0;

io.sockets.on('connection', function (socket) {
	socket.on('update', function (data) {
		var key = "cache:"+data.channel;

		client.get(key, function(err, value) {
			if(value == data.value) {
				return;
			}

			socket.broadcast.in(data.channel).emit('update', { channel: data.channel, value: data.value });

			client.set(key, data.value);
			client.expire(key, 12 * 3600);

			console.log(data.channel + ": " + data.value);
		});

		if(nbUpdates++ % 1000 == 0) {
			console.log("===> " + nbUpdates + " updates received.");
		}

		socket.join(data.channel);
	});
});
