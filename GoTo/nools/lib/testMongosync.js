var Fiber = require('fibers');
//var wait = require('wait.for');
var result = 1;
var fib = Fiber(function(a) {
	console.log("in");
	console.log(a);
  	var Server = require("mongo-sync").Server;
	var server = new Server('127.0.0.1');
	debugger;
	result = server.db("WorkingMemory").getCollection("Passenger").find().toArray();
	//console.log(result);
	Fiber.yield(result);
});

result = fib.run('a');

function setResult(r){
	result = r;
}
console.log("out");
console.log(result);
/*
console.log(result);
var Server = require("mongo-sync").Server;
var server = new Server('127.0.0.1');
wait.launchFiber(f,server.db("WorkingMemory"));


function f(server){
	debugger;
	result = wait.forMethod(server,"getCollection","Passenger");
	r = wait.forMethod(result,find);
	console.log(r);
}

/*var mongojs = require('mongojs'), db = mongojs('WorkingMemory'),wait=require('wait.for');
var collection = db.collection('Passenger');
debugger;
//var result = wait.forMethod(collection,find);
console.log(result);
var mongo = new (require("mongo-sync").Server)();
mongo.db("WorkingMemory").getCollection("Passenger").find().toArray();

var Server = require("mongo-sync").Server;
var server = new Server('127.0.0.1');
var result = server.db("WorkingMemory").getCollection("Passenger").find().toArray();

console.log(result);
server.close();*/