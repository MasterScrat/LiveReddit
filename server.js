var SIGNIFICANT_UPDATE_THRESHOLD = 0.1;

var nbUpdates = 0;
var app = require('http').createServer(handler);
var io = require('socket.io').listen(app);
var fs = require('fs');
var redis = require("redis");
var client = redis.createClient(4001);

app.listen(8080);

io.sockets.on('connection', function (socket) {
	socket.on('update', function (data) {
		var key = data.channel;

		client.get(key, function(err, value) {
			if(!differenceIsSignificant(value, data.value)) {
				return;
			}

			socket.broadcast.in(data.channel).emit('update', { channel: data.channel, value: data.value });

			client.set(key, data.value);
			client.expire(key, 12 * 3600);

			//console.log(data.channel + ": " + data.value);
		});

		if(nbUpdates++ % 500 == 0) {
			console.log("===> " + nbUpdates + " updates received.");
		}

		socket.join(data.channel);
	});
});

function handler(req, res) {};

var differenceIsSignificant = function(a, b) {
	return a==null || b==null || Math.abs(a-b)/a > SIGNIFICANT_UPDATE_THRESHOLD;
};