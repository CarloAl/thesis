var WebSocket = require('ws');
var ws = new WebSocket('ws://127.0.0.1:8080');
var ws2 = new WebSocket('ws://127.0.0.1:8080');
var ws3 = new WebSocket('ws://127.0.0.1:8080');
ws.on('open', function() {
	console.log("opened");
	var obj = {destination:"VUB",passenger:1,price:10,radius:3,latitude:7.39,longitude:52.12,username:"passenger",taxi:false,phone:04756323
,time:"13:32"}
	ws.send(JSON.stringify(obj));
	
});

ws2.on('open', function() {
	console.log("opened");
	var obj = {destination:"VUB",passenger:3,price:10,radius:3,latitude:7.39,longitude:52.12,username:"taxi",taxi:true,phone:04756323
,time:"13:32"}
	ws.send(JSON.stringify(obj));
	
});


ws3.on('open', function() {
	console.log("opened");
	var obj = {destination:"VUB",passenger:1,price:10,radius:3,latitude:7.39,longitude:52.12,username:"p2",taxi:true,phone:04756323
,time:"13:31"}
	setTimeout(function(){ws3.send(JSON.stringify(obj))},3000);
	
});

ws.on('message', function(data, flags) {
    console.log(data);
});