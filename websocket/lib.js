var nools = require("nools");
var templateId = 0;
var objectId = 0;
var webSockets = [];
//array with all the defined template
var templates = [];
function defineTemplate(name,obj){
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
	template.prototype.__name = name;
	template.prototype.__templateId = templateId;
	templateId++;
	for(i=0;i<obj.size; i++){
		template.prototype[obj[i]] = 'not yet instantiated'
	}
	templates.push(template);
	return template;
}

function compile(scope,file){
	var define = {};
	for(i = 0; i < templates.length; i++){
		define[templates[i].prototype.__name] = templates[i];
	}
	return nools.compile(file,{define:define, scope: scope});
}

function dispatch(message,ws){
	message = JSON.parse(message);
	var date = new Date();
    	date.setMinutes((message.time.split(':'))[1]);
    	date.setHours((message.time.split(':'))[0]);
    	date.setSeconds(0);
    message.time = date;
    if((index = indexofTemplate(message.__type)) < 0){
		throw "template not present in the list of template";
	}else{
		obj = new templates[index](message);
	}
	webSockets[obj.objectId] = ws;
    //todo: instantiate a new template, 
	/*if(ws.customListeners.indexOf(message.__type) > -1)
		//delete message.__type; //?????
		ws.customCallBack[ws.customListeners.indexOf(message.__type)](obj);*/
	if(typeof ws.customCallBack[message.__type] == 'function' )
		ws.customCallBack[message.__type](obj);
}

//nools session
function myAssert(session,fact,flow){
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

function mySend(target,message,event){
	debugger;
	message.__type = event;
	webSockets[target.objectId].send(JSON.stringify(message));
}

function onConnection(wss,cb){
	wss.on('connection', function(ws) {
	//todo: customlistener etc should be on wss, or better create ur own class
	ws.customListeners = [];
	ws.customCallBack = [];
	
	ws.on('message', function(message) {       
        dispatch(message,ws);
    });

	ws.mySend = function(data){
		data.__type = data.prototype.__name;
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
		var index = webSockets.indexOf(5);
		if (index > -1) 
    		webSockets.splice(index, 1);
		console.log("closed");
		if(typeof cb =='function')
			cb();
	});

}

/*****util *******/
function indexofTemplate(type){
	for(i = 0; i < templates.length; i++)
		if(templates[i].prototype.__name.toLowerCase() === type.toLowerCase())
			return i;
	return -1;
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
//exports.dispatch = dispatch;
exports.myAssert = myAssert;
exports.onConnection = onConnection;