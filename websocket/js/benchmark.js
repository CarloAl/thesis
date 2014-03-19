var async = require('async');
var RUN = 1024;
var NEW_FACT = 0;
var REGISTER_TEMPLATE = 1;
var REQUIRE_TEMPLATE = 2;
var ANSWER_TEMPLATE = 3;
var ANSWER_TEMPLATE_NOT_FOUND = 4;
var NEW_FACT_ID = 5; 
var UPDATE_FACT = 6;
var DROP_REGISTRATION = 7;
var RETRACT_FACT = 8;
var SEND_FACT_FOR_TEMPLATE= 9;

var objectId = 0;
//used to alternate passenger and taxi
var tp = 0;
var id ;
var address = 'ws://127.0.0.1:8080';
var WebSocket = require('ws');
var lib = require('./benchmarkLib');
var listener;
var ws = [];

for(var i = 0 ; i < RUN ; i++){
	ws[i] = new WebSocket(address);
	ws[i].index  = i;
}
 
async.each(ws,fun,function(err){
	console.log(err);	
	console.log('done');
	});

function fun (ws,cb){

	
	ws.on('open', function() {
	   setTimeout(function(){
        
		var f = function(Template){
                    //console.log(ws.index);
	                var fact = new Template(getObj());
	                lib.sendNewFact(ws,fact);
	                listener = lib.registerTo(ws,Template,getFilter(), function(message){
                    	if(message.length == undefined)
                            debugger;
                    		//console.log("Filtered received: " + message.length);
                        
                    	//
                        
                    	//console.log(message);
        			});
	            }
	    
	    if(tp++ % 2 == 0)
	        //require ask for the definition of one or more "class" to the server. Last paramenter is the callback
	        lib.require(ws,"Taxi",f);
	    else
	        lib.require(ws,"Passenger",f);
        }, Math.random()*1000* 1);
	});	

	ws.on('close', function(a) {
    	//console.log('disconnected' + a );
	});

	lib.addEventListener(ws,'Taxi',function (Taxi){ 
        //console.log("Match! Taxi Found");
        listener.drop();
        //ws.close();
    });
	lib.addEventListener(ws,'Passenger',function (Passenger){ 
        //console.log("Match! Passenger Found");
        listener.drop();
        //can't close because if it is a taxi a lower the seats number but then I want to match him again
        //ws.close();
    });
    lib.addEventListener(ws,5,function (_id){ id = _id}  );

	ws.on('message', function(message){
        message = JSON.parse(message);
        type = lib.getType(message);
        if(typeof type == "string")
            type = type.toLowerCase();
        //console.log('Message received:');
        //console.log(message);
        
            if(type == ANSWER_TEMPLATE){
                var templatesString = message.data;
                Templates = [];
                for(var i = 0 ; i < templatesString.length; i++){
                    eval("Templates[i] = " + templatesString[i].template);
                    Templates[i].prototype.__type = templatesString[i].__type;
                }
                ws.customCallBack[type].apply(null,Templates);

            }else{
               if(type == SEND_FACT_FOR_TEMPLATE){
                    lib.registerCallback[message.data.idListener](message.data.facts)
                }else{
                    ws.customCallBack[type](message.data);  
                }
            }
    });
    return cb();
}


function getFilter(){
	var dest = getDest();
	var person = Math.floor(Math.random()*5);
	var price = Math.floor(Math.random()*10);
	/*return function(obj){
		return obj.destination == 'VUB' && obj.person == 3 && obj.price == 2;
	}*/
    return {$and : [{'object.person' : { $gte : person}}, { 'object.destination': dest}, {'object.price ' : price}]};
}



function getDest(){
	var dest = ["VUB","ULB","MADOU"];
	return dest[Math.floor(Math.random()*3)];
}

function getObj(){
	return { 
                destination: getDest(),
                person: 1 + Math.floor(Math.random()*5),
                price: 1 + Math.floor(Math.random()*10),
                radius: 1 + Math.floor(Math.random()*5),
                lat: Math.floor(Math.random()*5) + 7.39,
                long: Math.floor(Math.random()*5) + 52.12,
                username: 'Carlo',
                phone: '0456453423', 
                time: '14:53'
            }


}