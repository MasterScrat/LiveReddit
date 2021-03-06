// socket.io server location - on EC2 for now...
var serverUrl = "http://52.4.85.5:8080";

// loads socket.io.js
var socketio = $.get(serverUrl + "/socket.io/socket.io.js", eval);

var io;

socketio.complete(function() {
	if(io == undefined) {
		console.warn("Failed to load socket.io!");
		return;
	}

	var socket = io.connect(serverUrl);

	// channel listeners
	var listeners = {};

	var listenForUpdates = function(id, callback) {
		listeners[id] = callback; 
	};

	socket.on('update', function (data) {
		listeners[data.channel](data.value);
		//console.log("down:" +data.value +" on " + data.channel)
	});

	var joinChannel = function(chan) {
		socket.emit('subscribe', { channel: chan });
	};

	var sendUpdate = function(chan, val) {
		// TODO batch updates
		socket.emit('update', { channel: chan, value: val });
		//console.log("up:" +val +" on " + chan)
	};

	// gets the numeric value from labels
	var clean = function(txt) {
		txt = txt.replace(/ *\([^)]*\) */, '');
		txt = txt.replace(/\D/g, '');
		return txt;
	};

	// makes the proper label from a numeric value
	var addSuffix = function(suffix, count) {
		if(suffix == "") return "";

		var txt = " " + suffix;
		if(Math.abs(count) > 0) {
			txt += "s";
		}

		return txt;
	};

	// update a counter with an animation
	var updatePointCount = function(el, count) {
		if(el.is(":visible")) {
			el.fadeOut(function() {
				$(this).html(count).fadeIn();
				$(this).css("display", "");
			});

		} else {
			el.html(count);
		}
	};

	// selector catches all the counters
	$(".unvoted.score, .comments").slice(0,500).each(function(index, el){
		var el = $(el);
		var text = clean(el.text());

		// get the id of the counter
		var id = el.closest("[data-fullname^=t1_], [data-fullname^=t3_]").eq(0).attr("data-fullname");

		if(id != undefined) {
			// is it a comment or a point counter?
			var  channel;
			if(el.hasClass("comments")) {
				channel = "comment_" + id;
			} else {
				channel = "point_" + id;
			}

			listenForUpdates(channel, function(newText) {
				newText *= 1;

				if(text == newText) {
					//console.log("wasted");
					return;
				} else {
					//console.log("from " + text + " to " + newText);
				}

				var suffix;

				// POINTS
				if(el.hasClass("unvoted")) {
					suffix = "point";

					if(el.is("div")) {
						// counter on front page, no "points"
						suffix = "";
					}

					updatePointCount(el, newText + addSuffix(suffix, newText));
					updatePointCount(el.prev(), (newText - 1) + addSuffix(suffix, (newText - 1)));
					updatePointCount(el.next(), (newText + 1) + addSuffix(suffix, (newText + 1)));
				}

				// COMMENTS
				if(el.hasClass("comments")) {
					suffix = "comment";
					var countNew = "";

					if(el.closest(".front-page").length == 0) {
						countNew = " <span style=\"color:orangered;\">("+ (newText*1-text*1) +" new)</span>";
					}

					updatePointCount(el, newText + addSuffix(suffix, newText) + countNew);
				}

				text = newText;
			});

			if(text != "") {
				if(!el.parent().hasClass("collapsed")) {
					sendUpdate(channel, text);
				}
			} else {
				// point count hidden
			}
		}
	});
});

// analytics
var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-36471625-4']);
_gaq.push(['_trackPageview']);

(function() {
  var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
  ga.src = 'https://ssl.google-analytics.com/ga.js';
  var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();