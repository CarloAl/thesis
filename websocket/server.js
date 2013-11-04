var http = require("http");
var url = require("url");
var nools = require("nools");


var flow = nools.compile("./rule.nools",{scope: {matchFound: matchFound }});

var session1 = flow.getSession();
function matchFound(taxi,passenger){
	debugger;
	passenger.ws.send(JSON.stringify({
		username: taxi.username,
		phone: taxi.phone
	}));
	taxi.ws.send(JSON.stringify({
		username: passenger.username,
		phone: passenger.phone
	}));
}

Taxi = flow.getDefined("Taxi");
Passenger = flow.getDefined("Passenger");

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
wss.on('connection', function(ws) {
    ws.on('message', function(message) {
        console.log('received: %s', message);
        received = JSON.parse(message);
        var date = new Date();
    	date.setMinutes((received.time.split(':'))[1]);
    	date.setHours((received.time.split(':'))[0]);
        if(received.taxi == true) {
    		var aPassenger = new Passenger({
    				destination : received.destination, 
    				time : date, 
    				radius : received.radius , 
    				person : received.passenger ,
    				maxPrice: received.price,
    				long: received.longitude,
    				lat: received.latitude,  
    				username: received.username, 
    				ws : ws,
    				phone: received.phone,
    				matched : false });
    		console.log("\n" + session1.assert(aPassenger));
    	}else{
    		var aTaxi = new Taxi({
    				destination : received.destination, 
    				time : date, 
    				radius : received.radius , 
    				person : received.passenger ,
    				maxPrice: received.price,
    				long: received.longitude,
    				lat: received.latitude,  
    				username: received.username, 
    				phone: received.phone,
    				ws : ws,
    				matched : false });
    		console.log("\n" + session1.assert(aTaxi));
    	}

    });
	ws.on('close',function(){
		debugger;
		console.log("closed");
	})
    //ws.send('something');
});

session1.matchUntilHalt()
    .then(
        function(){
            //all done!
        },
        function(err){
            console.log(err.stack);
        }
    );

exports.start = start;