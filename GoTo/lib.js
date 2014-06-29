var nools = require("./nools/index");
var util = require('util');
//var nools = require('nools');
var path = require('path');
var Primus = require('primus');
var http = require("http");
var url = require("url"),
	oid = require('oid'),
	JSONfn = require('json-fn'),
	sift = require("sift");
var fs = require('fs');


var factsPerUser = [];
var leasedFacts = {};
var retractWith = {};
var globalUID = 0;
var updateFromClient = false;
var server;
var templateId = 0;
var objectId = 0;
var factSent = [];
//array with all the open websocket
var webSockets = [];
//array with all the defined template
var templates = [];
var session,flow;

var isAtCoordinates = {}
var isDisconnected = {};
var disconnected = {};
//for each template I have an array of websockets (the clients) interested to them
var listeners = []; 
//vector that keep track of the webspcket of the client that assert new rule at run time
var callbackOnFiredRules = [];
//value of the __type in a websocket message, indicate that we want to assert a new fact
var NEW_FACT = 1230;
//value of the __type in a websocket message, indicate that we want to register to a template
var REGISTER_TEMPLATE = 1231;
//value of the __type in a websocket message, indicate that the client is requesting a class template
var REQUIRE_TEMPLATE = 1232;
//value of the __type in a websocket message, when the server answer with the template
var ANSWER_TEMPLATE = 1233;
//value of the __type in a websocket message, when there's no such template
var ANSWER_TEMPLATE_NOT_FOUND = 1234;
//value of the __type in a websocket message, when the server answer a new fact with the new ID
var NEW_FACT_ID = 1235; 
//value of the __type in a websocket message, when the client send an update
var UPDATE_FACT = 1236;
//value of the __type in a websocket message, when the client is not interested anymore in a template
var DROP_REGISTRATION = 1237;
//value of the __type in a websocket message, when the client retract a fact
var RETRACT_FACT = 1238;
//value of the __type in a websocket message, when the server send a fact a client registerd or
var SEND_FACT_FOR_TEMPLATE = 1239;
//value of the __type in a websocket message, when the client install a new rule on the server
var CUSTOM_RULE = 12310;
//value of the __type in a websocket message, when the server answer because a rule got fired in the client
var RULE_FIRED = 12311;

var UPDATE_FACT_SERVER = 12312

var DISPOSE  = 12313

var USER_ID                   = 12314;

var  NEW_USER_ID = 12315;
//value of the __type in a websocket message, when the server send a new version of a previously sent fact
var UPDATE_FACT_PREVIOUSLY_SENT = 12316

var openWebosockets = 0;
/*****
benchmark variable
***/
var benchmark = false,
	nFact = 0,
	//limit 1007
	totFact = 1024;
//var posix = require('posix');

// raise maximum number of open file descriptors to 10k,
// hard limit is left unchanged
//posix.setrlimit('nofile',  { soft: 10000, hard: 10000 });




var server = http.createServer(function (request, response) {
    console.log('request starting...');
	
	var filePath = '.' + request.url;
	if (filePath == './')
		filePath = './html/index.html';
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
				if (error){
					response.writeHead(500);
					response.end();
				}else {
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

var primus = new Primus(server, { transformer: 'websockets', parser: 'JSON' });

//primus.save('/primus.js');

primus.on('disconnection', function (spark) {
	
	console.log("spark uid " + spark.uid + "disconnected");
	debugger;
	disconnected[spark.uid] = session.assert(new isDisconnected({uid : spark.uid}));
	for (var i = factsPerUser[spark.uid].length - 1; i >= 0; i--) {
		//now it s implemented in nools
		/*if(factsPerUser[spark.uid][i].retractOnDisconnection) 
			try{
				session.retract(factsPerUser[spark.uid][i]);
			}catch(e){
				//the fact has already been retracted
			}*/
	};


});


primus.on('connection', function(spark) {
//	spark.customCallBack = [];
	console.log("id ",spark.id);
	spark.on('data', function(message) {       
        	dispatch(message,spark);
    });

	spark.on('close',function(){
		var index = webSockets.indexOf(spark);
		if (index > -1){ 
			//console.log(webSockets.length);
    		webSockets.splice(index, 1);
    		//console.log(webSockets.length);
    	}
		//console.log("closed");
	});
/*
	spark.addEventListener = function(event,cb){
		spark.customCallBack[event] = cb;
	}*/
});

console.log('Server running at http://127.0.0.1:8888/');


function defineTemplate(name,obj,options){
	var template = function (opts){
		opts = opts || {};
        for (var i in opts) {
            if (i in template.prototype) {
                this[i] = opts[i];
            }
        }
        this.__clientObjectId = opts.objectId;
        this.leased = false;
        this.objectId = objectId++;

	};
	//when you call cancel it eliminates from the buffered messages all the messages related to the fact
	template.prototype.cancel = function(){
		debugger;
		var that = this;
		webSockets[this.__uid].bufferedMessages = webSockets[this.__uid].bufferedMessages.filter(function(element){
			element.id == that.objectId;
		});
		
	}
	template.prototype.__type = name;
	template.prototype.__clientObjectId;
	template.prototype.__templateId = templateId;
	template.__type = name;
	template.__templateId = templateId;
	templateId++;
	for(i in obj){
		template.prototype[i] = 'not yet instantiated'
	}
	//templates.push(template);
	templates[name] = template;
	return template;
}

function updateDate(){
	var date = session.assert(new Date());
	setTimeout(function(){
		session.retract(date)
	},59 * 1000);
	setTimeout(updateDate,60 * 1000);

	
}

function initNools(file,scope){
	if(typeof scope == 'undefined')
		scope = {};

	flow = compile(scope,file);
	/*flow.rule("retractLeased", {salience: 7}, [
        [isDisconnected, "id",{uid:"uid"}],
        [Object, "f", "f.__uid == uid && f.retractOnDisconnection == true" ]
    ], function (facts) {
        this.retract(facts.f);
    });*/

	session = flow.getSession(addTimeLeasedFact);
	updateDate();
	session.on("assert", function(data){
		//console.log("data asserted:");
		//console.log(data);
		
		var type = getType(data);
		sendToListeners(type,data);
	});

	session.on("modify", function(data){
		if(updateFromClient)
			updateFromClient = false;
		else{
			var type = getType(data);
			sendToListeners(type,data);
			mySend(webSockets[data.__uid],data,UPDATE_FACT_SERVER);
		}
		if(factSent[data.objectId] != undefined){
			for(i = 0 ; i < factSent[data.objectId]; i++ )
				mySend(webSockets[factSent[i]], data, UPDATE_FACT_PREVIOUSLY_SENT);
		}
	});

	session.on("retract",function(fact){
		if(retractWith[fact._id] != undefined)
			for (var i = retractWith[fact._id].length - 1; i >= 0; i--) {
				session.retract(retractWith[fact._id][i]);
			}
	});
	
	if(!benchmark){
		session.matchUntilHalt()
		    .then(
		        function(){
		            console.log("\nmatch done");
		        },
		        function(err){
		            console.log(err.stack);
		        }
		    );
	}
	return session;

}




//given an array of facts and the filter function, as string, give back a subset of the facts that hold the conditions
function filterOut(facts,filter){
	//filtered results
	return sift(filter,facts);
}


//add a listener {ws,condition} for a specific template (facts with hole)
function addListener(type,ws,message){
	if(typeof type == "string")
		type = type.toLowerCase();
	if(listeners[type] == undefined)
		listeners[type] = [];
	listeners[type].push({ws: ws, filter: message.data.filter, id:message.data.id});
}

//send to all the listeners interested to templatelateId the new fact
function sendToListeners(type,obj){
	if(listeners[type] != undefined)
		for(var i = 0; i < listeners[type].length; i++){
			//I wrap obj in {object : obj } because when I call filterOut it exepcts an array of facts retrieved from
			//the db, so with _id and obejct field.
			filtered = filterOut([{object : obj}],listeners[type][i].filter);
			if(filtered.length > 0)
				if(Array.isArray(filtered))
				//it is filterd[0] because filterOut gives back an array but here it is going to be only one new facts
			        //I also have to send listeners[type][i].id so the client can dispatch between different listeners

					mySend(listeners[type][i].ws,{facts:filtered , idListener: listeners[type][i].id},
					 SEND_FACT_FOR_TEMPLATE);
				else
					debugger;
		}
}

//dispatch the new message
function dispatch(message,ws){
	//console.log('received : ');
	//console.log(message);
	//message = JSONfn.parse(message);
	
    var type = getType(message);
    switch(type){
    	case USER_ID:
    		var messageUID = message.data;
    		if(messageUID == -1){
    			//new connections
    			var newUID= ++globalUID;
    			mySend(ws,newUID,NEW_USER_ID);
    			webSockets[newUID] = ws;
    			ws.bufferedMessages = [];
    			ws.uid = newUID;
    			factsPerUser[newUID] = [];
    		}else{
    			//reconnection
    			//get all the messages, reassart all the facts, reassert all the messages
    			console.log("reconnection of uid " + messageUID);
    			if(disconnected[uid]){
    				session.retract(disconnected[uid]);
    				disconnected[uid] = null;
    			}
    			/*if(webSockets[messageUID] && webSockets[messageUID].bufferedMessages){
    				var bufferedMessages = webSockets[messageUID].bufferedMessages;
    				//check for expired messages
    				for(i = 0 ; i < bufferedMessages.length ; i++)
    					mySend(ws, bufferedMessages[i].data, bufferedMessages[i].__type,bufferedMessages[i].id) ;	
    			}*/
    			ws.uid = messageUID;
    			webSockets[messageUID] = ws;
    			/*for (var i = factsPerUser[messageUID].length - 1; i >= 0; i--) {
					if(!factsPerUser[messageUID][i].leased)
						session.assert(factsPerUser[messageUID][i]);
				};*/
    		}
    		break;
    	case DISPOSE:
    		//session.dispose();
    		session = flow.getSession();
    		session.assert(new Date());
    		session.matchUntilHalt();
    		break;

    	case REGISTER_TEMPLATE:

	    	var template = getTemplateFromMessage(message);

	    	var noolsTemplate = flow.getDefined(template);
	    	//get facts now is async because is a query to mongodb
	    	session.getFacts(noolsTemplate,getFilterFromMessage(message),function(facts){
				if(facts.length > 0)
	    			mySend(ws,facts,template);
				
	    	});
	    	
			addListener(template,ws,message);
			break;
	    case NEW_FACT:

	    	if(benchmark){
	    		//console.log(nFact);
	    		if(nFact == 0)
	    			console.time('benchmark');

	    		nFact++;
	    		if(nFact == totFact){
	    			console.log('starting matching');
					console.time('matching');	    			
	    			session.match(function(err){
					    if(err){
					        console.error(err);
					    }else{
					    	console.log('Total matches ' +countMatches);
					    	console.log('Total time:')
					        console.timeEnd('benchmark');
					        console.timeEnd('matching');
					    }
					});
	    		}
	    	}

    		var templateName = message.data.fact.__type;
		    if((index = indexofTemplatebyName(templateName)) == -1){
				throw "template not present in the list of template";
				//more checking that all the field are instantied, maybe
			}else{
				var uid = message.uid;
				obj = new templates[index](message.data.fact);

				
				
				
				console.log(obj);
				//if(templates[index].automaticallyAsserted)
				//save the websocket for a possible answer 
				//webSockets[obj.objectId] = ws;
				var cb = sendId(ws,obj.__clientObjectId);
				var fact;
				
				if(message.data.opts != undefined){
					if(message.data.opts.leaseTime != undefined){
						cb = function(_id, id,objectId){
							sendId(ws,fact.__clientObjectId);
							addTimeLeasedFact(_id,fact,message.data.opts.leaseTime);
						}
					}
					
				}
				debugger;
				fact = myAssert(obj,cb);
				fact.__uid = uid;
				factsPerUser[uid].push(fact);
				if(message.data.opts != undefined ){
					if(message.data.opts.retractOnDisconnection != undefined){
						fact.retractOnDisconnection = true;

					}

					if(message.data.opts.retractWith != undefined){
						if(retractWith[message.data.opts.retractWith] == undefined)
							retractWith[message.data.opts.retractWith] = [];
						retractWith[message.data.opts.retractWith].push(fact);

						
					}
				}
				/*var Passenger = flow.getDefined("Passenger");
			    var Taxi = flow.getDefined("Taxi");
			    flow.rule("Test", [["Passenger", "p", "p.destination == 'VUB' && p.price < 11 && p.person > 2", {destination:"pd"}],
			                       ["Taxi", "t", "t.destination == pd"]],
			                        function (facts) {
								        console.log(facts.p.destination);
								        debugger
								        console.log("fired");
			    });
			    session.ruleAtRunTime(flow.__rules[flow.__rules.length-1]);*/

				//checkCBandCall(ws.customCallBack[type],obj);
			}
			break;
		case REQUIRE_TEMPLATE:

			var templatesName = message.data;

			var answerTemplates = [];
			var err = false;
			for(var i = 0 ; i < templatesName.length; i++){
				if(templates[templatesName[i]] == undefined)
					err = "Template " + templatesName[i] + " not present in the server.";
				else{
					var Template = templates[templatesName[i]];
					answerTemplates.push({'template': Template.toString(), 
										  'prototype' : JSON.stringify(Template.prototype),
										  '__type': Template.__type});
				}
			}
			if(err)
				mySend(ws,err,ANSWER_TEMPLATE_NOT_FOUND);	
			mySend(ws,answerTemplates,ANSWER_TEMPLATE);
			break;
		case UPDATE_FACT:
			var templateName = getTemplateNameFromMessage(message)
			updateFromClient = true;
			console.log("updating fact");
			console.log(message.data);
		    if((index = indexofTemplatebyName(templateName)) == -1){
				throw "template not present in the list of template";
				//more checking that all the field are instantied, maybe
			}else{
				var obj = new templates[index](message.data)
				//obj.objectId = message.data.objectId;
				obj._id = message.data._id;
				//obj.id = message.data.id;

				modify(obj);
			}
			break;
		case DROP_REGISTRATION:
			var type = message.data.type.toLowerCase();
			var size = listeners[type].size;
			listeners[type] = listeners[type].filter(function(listener){
				
				if(listener.id != message.data.id && ws == listener.ws)
					return true
				return false;
			});
			if(size - 1 == listeners[type].size)
				console.log("errorrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr");
			
			break;
		case RETRACT_FACT:
			debugger;
			var id = message.data.id;
			var type = message.data.type;
			session.retractByMongoId(id,type);
			break;
		case CUSTOM_RULE:
			var rule = message.data;
			var name = oid.hash(ws) + rule.name ;
			callbackOnFiredRules[name] = ws;
			if(rule.notifyMe){
				session.on("fire",function(name,facts){
					mySend(callbackOnFiredRules[name],{facts : facts, ruleName : rule.name},RULE_FIRED);
				})
			}
			flow.rule(name, rule.constraint, rule.action);
			session.ruleAtRunTime(flow.__rules[flow.__rules.length-1]);
			break;
	}
	
}

function addTimeLeasedFact(_id,fact,leaseTime){
	leasedFacts[_id] = {}
	leasedFacts[_id].leaseTime = leaseTime;
	leasedFacts[_id].setTimeoutID = setTimeout(function(){
		retract(fact);
	},leaseTime);
	leasedFacts[_id].fact = fact;
	fact.leased = true;	
}

function retract(fact){
	try{
		session.retract(fact);
	}catch(e){
		//already retracted
	}
}

function modify(fact){
	var _id = fact._id;
	if(leasedFacts[_id] != undefined){
		clearTimeOut(leasedFacts[_id].setTimeoutID);
		leasedFacts[_id].setTimeoutID = setTimeout(leasedFacts[_id].leaseTime,function(){
			//should check id if it is still there
			retract(fact);
		});
	}
	session.modifyByMongoId(fact);
}

function sendId(ws,clientId){
	//mongo,nools,mine
	return function(_id, id,objectId){
		mySend(ws,{clientId: clientId, id:id, _id:_id, objectId:objectId},NEW_FACT_ID);
	}

}

function plusMinutes(minutes,date){
	var startTimeMinus10 = new Date(date);
	var durationInMinutes = minutes;
	startTimeMinus10.setMinutes(startTimeMinus10.getMinutes() + durationInMinutes);
	return startTimeMinus10;
}

function currentTimeIn(currentTime, startTime , endTime ,caller){
	var startTime = new Date(startTime);
	var startTimeMinus10 = new Date(startTime);
	var durationInMinutes = 10;
	var endTime = new Date(endTime);
	var currentTime = new Date(currentTime);
	startTimeMinus10.setMinutes(startTime.getMinutes() - durationInMinutes);
	if(currentTime.getTime() > startTimeMinus10.getTime() && currentTime.getTime() < endTime.getTime() )
		return true;
	return false;
}

function checkifInBetween(lat , long, latBL, longBL, latUR, longUR,caller){
	
	var test =  lat >= latBL && lat <= latUR && long >= longBL && long <= longUR ;
	
	if( lat >= latBL && lat <= latUR && long >= longBL && long <= longUR ){
		return true
	}
	return false;
}

function deg2rad(deg) {
  return deg * (Math.PI/180);
} 


function getDistanceFromLatLonInKm(lat1,lon1,lat2,lon2) {

  if(lat1===lat2 && lon1===lon2){
   return 0
  }else{
     var R = 6371; // Radius of the earth in km
     var dLat = deg2rad(lat2-lat1);  
     var dLon = deg2rad(lon2-lon1); 
     var a = 
       Math.sin(dLat/2) * Math.sin(dLat/2) +
       Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
       Math.sin(dLon/2) * Math.sin(dLon/2); 
     var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
     var d = R * c; // Distance in km
     return d;
  }
}


function checkDistance(lat1,lon1,lat2,lon2,radius,f1,iac1,ncf,ncf1,iac2){

  //var radius = radius1<radius2?radius1:radius2;
  if(getDistanceFromLatLonInKm(lat1,lon1,lat2,lon2) <= radius){
  	//console.log(" check distance true");
    return true
  }else{
  	//console.log(" check distance false");
    return false;
  }
}

function closeEnough(personLat, personLong, latBL, longBL, latUR, longUR,CLOSE_ENOUGH_DISTANCE,f1,f2,iap1,iap2,iatc1,hc){
	
	return checkDistance(personLat,personLong, (latBL + latUR) / 2 , (longBL + longUR) / 2, CLOSE_ENOUGH_DISTANCE);
}

//nools session
function myAssert(fact,cb){

	if((index = indexofTemplatebyName(fact.__type)) == -1){
		throw "template not present in the list of template";
	}else{
		//Template = templates[index]; doesn t work, probably nools does something behind the scenes
		//the flow already makes comparison non case sensitive
		/*Template = flow.getDefined(fact.__type);
		asserted = new Template(fact);*/
		if(fact.person <= 0)
					debugger;
		asserted = session.assert(fact, cb);		
	}
	return asserted;

}


function notifyAll(fact1 , fact2){
    try{
    	notify(fact1,fact2);
    	notify(fact2,fact1);
	}catch(err){
		console.log(err);
		console.log(err.stack);
	}
}

var countMatches = 0;

//notify the sender of the obj target with message
//object is to get the id of the message for successive retract
function notify(target,type, facts){
	var ws = webSockets[target.__uid];
	if(!util.isArray(facts))
		facts = [facts];
	//save the facts that you are sending so that if in the future there's a change to them you send the updates to the user
	for(i = 0 ; i < facts.size; i++){
		//for every fact sent you keep a list of ws that are 
		//TODO: check that if u have a disconnection change the ws
		if(factSent[fact.objectId] == undefined)
			factSent[fact.objectId] = [];
		factSent[fact.objectId].push(target.__uid);
}
	if(typeof webSockets[target.__uid] == 'undefined'){
		throw "no websocket associated to " + target;
	}else{
		mySend(ws,facts,type,object.objectId); 
	}
	var message = {}
	message.onCancel = function(fact){
		if(ws.readyState == ws.primus.Socket.OPEN){
			obj = {data: message, __type : type, id:fact.objectId}
			ws.bufferedMessages.push(obj);
		}
	}
	/*}else{
		message = type;
		if(typeof webSockets[target.__uid] == 'undefined'){
			debugger
			throw "no websocket associated to " + target;
		}else{
		
				mySend(webSockets[target.__uid],message,,object.objectId); 
		}	
	}*/
	
}

function compile(scope,file){
	var define = {};
	scope.notify = notify;
	scope.notifyMe = function(){};
	scope.checkifInBetween = checkifInBetween;
	scope.plusMinutes = plusMinutes;
	scope.checkDistance = checkDistance;
	scope.currentTimeIn = currentTimeIn;
	scope.closeEnough = closeEnough;
	scope.notifyAll = notifyAll;

	//for(i = 0; i < templates.length; i++){
		for(i in templates)
			define[templates[i].prototype.__type] = templates[i];
	//}
	var tmp = {}
	tmp['personId'] = undefined;
	tmp['lat'] = undefined;
	tmp['long'] = undefined;
	isAtCoordinates = defineTemplate('isAtCoordinates',tmp);
	define["isAtCoordinates"] = isAtCoordinates;
	isDisconnected['uid'] = undefined;
	isDisconnected = defineTemplate('isDisconnected', isDisconnected);
	define["isDisconnected"] = isDisconnected;
	return nools.compile(file,{define: define, scope: scope});
}

//if we decide to send always template instances we don't need event
function mySend(ws,message,event,id){
	//if(typeof event == 'string')
		//message.__type = event;	
	obj = {data: message, __type : event, id:id}
	if(ws.readyState == ws.primus.Socket.OPEN){
		ws.write(JSONfn.stringify(obj));
	}else{
		ws.bufferedMessages.push(obj);
	}
}








/*****util *******/
function getType(message){
	if(typeof message.__type == "string")
		message.__type = message.__type.toLowerCase();
    return message.__type;
}



function getTemplateId(message){

    return message.data.__templateId;
}

function indexofTemplatebyName(type){
 	/*for(i = 0; i < templates.length; i++)
 		if(templates[i].prototype.__type.toLowerCase() === type.toLowerCase())
 			return i;
 	return -1;*/
 	for(i in templates)
 		if(templates[i].prototype.__type.toLowerCase() === type.toLowerCase())
 			return i;
 	return -1;
 }


function indexofTemplate(templateId){
	/*for(i = 0; i < templates.length; i++)
		if(templates[i].prototype.__templateId == templateId)
			return i;
	return -1;*/
	for(i in templates)
		if(templates[i].prototype.__templateId == templateId)
			return i;
	return -1;
}

function checkCBandCall(cb,arg){
	if(typeof cb == 'function')
		cb(arg);
	else{
		//console.log('not a callack');
	}
}


function getTemplateNameFromMessage(message){
	if (message.data.__type == 'undefined')
		throw 'template non defined'
	else
		return message.data.__type;
}

function getTemplateFromMessage(message){
	if (message.data.template == 'undefined')
		throw 'template non defined'
	else
		if(typeof message.data.template == "string")
			message.data.template = message.data.template.toLowerCase();
		return message.data.template;
}

function getFilterFromMessage(message){
	if (message.data.filter == 'undefined')
		throw 'filter non defined'
	else
		return message.data.filter;
}

exports.defineTemplate = defineTemplate;
exports.compile = compile;
exports.mySend = mySend;
exports.initNools = initNools;
exports.myAssert = myAssert;

