var path = require('path');
var http = require("http");
var url = require("url");
var lib  = require("./lib");
var fs = require('fs');

var TaxiO = {
	destination: '',
	time: '',
	radius: '',
    person: '',
    price: '',
    long: '',
    lat: '',
    username: '',
    userId: '',
    ws : '',
    phone: '',
    matched: false
}

var PassengerO = {
	destination: '',
	time: '',
	radius: '',
    person: '',
    price: '',
    long: '',
    lat: '',
    username: '',
    userId: '',
    ws : '',
    phone: '',
    matched: false
}

var Taxi = lib.defineTemplate('Taxi',TaxiO);
var Passenger = lib.defineTemplate('Passenger',PassengerO);
var file = "./rule.nools";
var flow = lib.compile({matchFound: matchFound },file)


count = 0;


var session1 = flow.getSession();

function matchFound(taxi,passenger){
	console.log("\nmatch found");
// we want the second parameter specifying the name of the event beucase dispatching only on the type of the attribute 
//wouldn't permit to distinguisch if it is a new passenger, an update, a match...
	lib.mySend(passenger,taxi,'matchFound');
	lib.mySend(taxi,passenger,'matchFound');
}

function start(route, handle){
   function onRequest(request,response) {
      var pathname = url.parse(request.url).pathname;
      console.log("request for " + pathname + " received");
      route(handle,pathname,response,request);
   }
   http.createServer(onRequest).listen(8888);
   console.log("server started");
}

var WebSocketServer = require('ws').Server, 
	wss = new WebSocketServer({port: 8080});

lib.onConnection(wss,function(ws){

	ws.addEventListener('taxi',function(message){
		console.log('received:');
		console.log(message);
		lib.myAssert(session1,message,flow);
	});

    ws.addEventListener('passenger',function(message){
		console.log('received:');
		console.log(message);
		lib.myAssert(session1,message,flow);});

    lib.onClose(ws);
});


session1.matchUntilHalt()
    .then(
        function(){
            console.log("\nmatch done");
        },
        function(err){
            console.log(err.stack);
        }
    );


exports.start = start;


http.createServer(function (request, response) {
    console.log('request starting...');
	debugger;
	
	var filePath = '.' + request.url;
	if (filePath == './')
		filePath = './html/start.html';
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
	

	console.log(filePath);
	path.exists(filePath, function(exists) {
	
		if (exists) {
			console.log(' exist');
			fs.readFile(filePath, function(error, content) {
				if (error) {
					response.writeHead(500);
					response.end();
				}
				else {
					response.writeHead(200, { 'Content-Type': contentType });
					response.end(content, 'utf-8');
				}
			});
		}
		else {
			console.log('don t exist');
			response.writeHead(404);
			response.end();
		}
	});
	
}).listen(8888);
console.log('Server running at http://127.0.0.1:8888/');