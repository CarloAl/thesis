var nools = require("nools");
var path = require('path');
var http = require("http");
var url = require("url");
var fs = require('fs');

var templateId = 0;
var objectId = 0;
var webSockets = [];
//array with all the defined template
var templates = [];
var session,flow; 

//for each template I have an array of websockets (the clients) interested to them
var listeners = []; 

//value of the __type in a websocket message, indicate that we want to register to a template
var REGISTER_TEMPLATE = 1;

var WebSocketServer = require('ws').Server, 
wss = new WebSocketServer({port: 8080});


http.createServer(function (request, response) {
    console.log('request starting...');
	
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
console.log('Server running at http://127.0.0.1:8888/');


//object with cancel method to cancel ws =lib.onnewfact('taxi',function(message))
onConnection(wss,function(ws){
/*
	ws.addEventListener('taxi',function(message){
		//could create a function that assert automatically..
		console.log('received:');
		console.log(message);
		lib.myAssert(session1,message,flow);
	});
	/*
    ws.addEventListener('passenger',function(message){
		console.log('received:');
		console.log(message);
		lib.myAssert(session1,message,flow);});

    onClose(ws);*/
});


function defineTemplate(name,obj,options){
	if(indexofTemplate(name) > - 1)
		throw "Template already defined"
	var template = function (opts){
		opts = opts || {};
        for (var i in opts) {
           // if (i in options) {
                this[i] = opts[i];
            //}
        }
        this.objectId = objectId++;

	};
	template.prototype.__type = name;
	//template.prototype.__templateId = templateId;
	//if(options.automaticallyAsserted == true)
	//	template.automaticallyAsserted = true;
	//templateId++;
	for(i=0;i<obj.size; i++){
		template.prototype[obj[i]] = 'not yet instantiated'
	}
	templates.push(template);
	return template;
}

function initNools(file,scope){
	if(typeof scope == 'undefined')
		scope = {};
	flow = compile(scope,file);

	//check if it is on different processes or not (doesn't seems so)
	session = flow.getSession();

	session.on("assert", function(data){
		console.log("data asserted:");
		console.log(data);
		var type = getType(data);
		sendToListeners(type,data);
	});
	/*session.on('match',function(){
		console.log("Match");
		console.log(session.getFacts(flow.getDefined('Match')));

		console.log("Taxi");
		console.log(session.getFacts(flow.getDefined('Taxi')));

		console.log("Passenger");
		console.log(session.getFacts(flow.getDefined('Passenger')));

		Match = flow.getDefined('Match');
		match = session.getFacts(Match);

		flow.rule("test",[Match,"m"," m.Passenger.person == 3"],function(facts){
			console.log("work\n\n");
			emit('test');
		});

		ses = flow.getSession(match);
		ses.on('test',function(){
			console.log("work\n\n");
		});
		debugger;
		ses.match().then(
	        function(){
	            console.log("\nmatch done");
	        },
	        function(err){
	            console.log(err.stack);
	        }
	    );
	})*/
	session.matchUntilHalt()
    .then(
        function(){
            console.log("\nmatch done");
        },
        function(err){
            console.log(err.stack);
        }
    );
	return session;

}

function compile(scope,file){
	var define = {};
	scope.notify = notify;
	for(i = 0; i < templates.length; i++){
		define[templates[i].prototype.__type] = templates[i];
	}
	return nools.compile(file,{define:define, scope: scope});
}

//given an array of facts and the conditions, as code to be executed on the facts, give back a subset of the facts that hold the conditions
/*function filterOut(facts,conditions){
	//filtered results
	array = [];
	filters = [];
	filters["="] = function (){return arguments[0] == arguments[1];}
	//for every fact of that type
	for(var i = 0 ; i < facts.length; i++){
		var ok = true;
		//for every condtion
		for(condition in conditions){
			if(conditions[condition] != "" && condition.substring(0,2) !="__" && condition.indexOf("Function") < 0){ //i.e. it's filled out and it is not an extra paramter
				//create a new function with the client code
				if(conditions[condition+"Function"] in filters)
					filterFunction = filters[conditions[condition+"Function"]];
				else
					//if u pass the body
					//filterFunction = new Function(conditions[condition+"Function"]);

					//if u passa a lambda
					eval("var filterFunction = " + conditions[condition+"Function"])

				value = filterFunction(facts[i][condition] , conditions[condition]);
				ok = ok && value;
			}
		}
		if(ok)
			array.push(facts[i]);
	}
	return array;
}
*/

//given an array of facts and the filter function, as string, give back a subset of the facts that hold the conditions
function filterOut(facts,filter){
	//filtered results
	filteredFacts = [];
	//for every fact of that type
	for(var i = 0 ; i < facts.length; i++){
		eval("var filterFunction = " + filter)
		if(filterFunction(facts[i]))
			filteredFacts.push(facts[i]);
	}
	return filteredFacts;
}


//add a listener {ws,condition} for a specific template
function addListener(type,ws,message){
	if(listeners[type] == undefined)
		listeners[type] = [];
	listeners[type].push({ws: ws, filter: message.filter});
}

//send to all the listeners interested to type the new fact
function sendToListeners(type,obj){
	if(listeners[type] != undefined)
	for(var i = 0; i < listeners[type].length; i++){
		filtered = filterOut([obj],listeners[type][i].filter);
		if(filtered.length > 0)
			//it is filterd[0] because filterOut gives back an array but here it is going to be only one new facts
			mySend(listeners[type][i].ws,filtered[0],type);
	}
}

//dispatch the new message
function dispatch(message,ws){
	console.log('received : ');
	console.log(message);
	message = JSON.parse(message);
	if(message.time != undefined){
		var date = new Date();
    	date.setMinutes((message.time.split(':'))[1]);
    	date.setHours((message.time.split(':'))[0]);
    	date.setSeconds(0);
    	message.time = date;
    }
    type = getType(message);
    if(type == REGISTER_TEMPLATE){
    	template = getTemplateFromMessage(message);
    	var noolsTemplate = flow.getDefined(template);
    	var facts = session.getFacts(noolsTemplate);
    	if(facts.length != 0){
    		facts = filterOut(facts,message.filter);
    		if(facts.length > 0)
    			mySend(ws,facts,template);
		}
		addListener(template,ws,message);
    }else{
	    if((index = indexofTemplate(type)) < 0){
			throw "template not present in the list of template";
			//more checking that all the field are instantied, maybe
		}else{
			obj = new templates[index](message);
			//if(templates[index].automaticallyAsserted)
			//save the websocket for a possible answer 
			webSockets[obj.objectId] = ws;
			myAssert(obj);
			
		}
		checkCBandCall(ws.customCallBack[type],obj);
	}
}

//nools session
function myAssert(fact){
	if((index = indexofTemplate(fact.__type)) < 0){
		throw "template not present in the list of template";
	}else{
		//Template = templates[index]; doesn t work, probably nools does something behind the scenes
		//the flow already makes comparison non case sensitive
		/*Template = flow.getDefined(fact.__type);
		asserted = new Template(fact);*/
		asserted = session.assert(fact);		
	}
	return asserted;

}
//@target and @message are two instance of 2 (or the same) templates
//notify the sender of the obj target with message
function notify(target,message){
	if(typeof webSockets[target.objectId] == 'undefined')
		throw "no websocket associated to " + target;
	else{
		mySend(webSockets[target.objectId],message,getType(message));
	}
}

//if we decide to send always template instances we don't need event
function mySend(ws,message,event){
	//if(typeof event == 'string')
		//message.__type = event;	
	obj = {data: message, __type : event}
	ws.send(JSON.stringify(obj));
}



function onConnection(wss,cb){
	wss.on('connection', function(ws) {
	ws.customCallBack = [];
	
	ws.on('message', function(message) {       
        dispatch(message,ws);
    });

	//not called anymore
	ws.mySend = function(data){
		data.__type = data.prototype.__type;
		ws.send(data);
	}

	ws.addEventListener = function(event,cb){
		/*if(event in ws.customListeners){
			ws.customCallBack[ws.customListeners.indexOf(event)] = cb;
		}else{
			ws.customCallBack.push(cb);
			ws.customListeners.push(event);
		}*/
		ws.customCallBack[event] = cb;
	}
	if(typeof cb == 'function')
		cb(ws);
    });

//io.sockets.on('connection', function(ws) {
    
        
	
    //ws.send('something');
	
}

function onClose(ws,cb){
	ws.on('close',function(){
		var index = webSockets.indexOf(ws);
		if (index > -1) 
    		webSockets.splice(index, 1);
		console.log("closed");
		checkCBandCall(cb);
	});

}

/*****util *******/
function getType(message){
	if(typeof message.__templateype == "string")
    	return message.__type.toLowerCase();
    return message.__type;
}

function indexofTemplate(type){
	for(i = 0; i < templates.length; i++)
		if(templates[i].prototype.__type.toLowerCase() === type.toLowerCase())
			return i;
	return -1;
}

function checkCBandCall(cb,arg){
	if(typeof cb == 'function')
		cb(arg);
	else
		console.log('not a callack');
}

function getTemplateFromMessage(message){
	if (message.template == 'undefined')
		throw 'template non defined'
	else
		return message.template;
}



/*
function myEqualsIgnoreCase(str1,str2){               
        return (new String(str1.toLowerCase())==(newString(arg)).toLowerCase());
}*/

/*var lib = {};
lib.defineTemplate = ;*/
exports.defineTemplate = defineTemplate;
exports.compile = compile;
exports.onClose = onClose;
exports.mySend = mySend;
exports.initNools = initNools;
exports.myAssert = myAssert;
exports.onConnection = onConnection;