var lib  = require("./lib");

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
var Match = lib.defineTemplate('Match',{Passenger:'',Taxi:''});
var file = "./rule.nools";
lib.initNools(file);
//var flow = lib.compile({/*matchFound: matchFound */},file)


/*var Taxi = lib.defineTemplate('Taxi',TaxiO);
var Passenger = lib.defineTemplate('Passenger',PassengerO);
var Match = lib.defineTemplate('Match',{Passenger:'',Taxi:''});*/

//object with cancel method to cancel ws =lib.onnewfact('taxi',function(message))
//match(rule, function(object) {});

//match(riderule, function(taxi, passenger) {});

/*/////////////////////////////////////****************

ALL OF THIS HAS TO GO THE LIBRARY
*************







var WebSocketServer = require('ws').Server, 
	wss = new WebSocketServer({port: 8080});



lib.onConnection(wss,function(ws){

	ws.addEventListener('taxi',function(message){
		//could create a function that assert automatically..
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
/*********************************************************************************/

/***************************************************
THIS ONE WILL GO IN THE LBIRARY AS WELL, IT WILL BE CALLES NOTIFY(TARGET,MESSAGE) AND WILL BE CALLED TWICE IN THE THEN OF THE RULE
//should be automatically
function matchFound(taxi,passenger){
	console.log("\nmatch found");
// we want the second parameter specifying the name of the event beucase dispatching only on the type of the attribute 
//wouldn't permit to distinguisch if it is a new passenger, an update, a match...
	lib.mySend(passenger,taxi,'matchFound');
	lib.mySend(taxi,passenger,'matchFound');
}


*******************************/
/*function start(route, handle){
   function onRequest(request,response) {
      var pathname = url.parse(request.url).pathname;
      console.log("request for " + pathname + " received");
      route(handle,pathname,response,request);
   }
   http.createServer(onRequest).listen(8888);
   console.log("server started");
}


exports.start = start;*/


