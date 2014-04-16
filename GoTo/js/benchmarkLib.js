var address = 'ws://127.0.0.1:8080';

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

var factId = 0
var fact;
var idListener = 0;
var objectId = 0;

function Listener(id,type,ws){
    this.idListener = id;
    this.type = type;
    this.ws = ws;
    this.drop = dropListener;
}

function dropListener(){
    if (this.ws.readyState === this.ws.OPEN)
        mySend(this.ws,{id: this.idListener, type : this.type} , DROP_REGISTRATION);
}

var registerCallback = [];

var requireCb = [];

//function myWebSocket(address){
    

    //this way you can add only one listener per type, if u add idlistener to the message to the server, then the server can send it back to dispatch to 
    //the right callback

    function registerTo(ws,template, filter, cb){
        mySend(ws,{template: template.prototype.__type, 
               filter: filter.toString(),
               id: idListener } , REGISTER_TEMPLATE/*,{template: template /*, idListener : idListener}*/);
        
        var type = template.prototype.__type;
        registerCallback[idListener] = cb;
        idListener++;
        return new Listener(idListener, type,ws);
    }


    //it just tell what to do in case we receive a fact of acertain type, doesn't talk to the server
    function addEventListener(ws,event,cb){
        if(ws.customCallBack == undefined)
            ws.customCallBack = [];
        if(typeof event == "string")
            ws.customCallBack[event.toLowerCase()] = cb;
        else
            ws.customCallBack[event] = cb;

    }

    
    


    function require(ws){
        var templates = [];
        for (var i = 1; i < arguments.length; i++) {
            if(typeof arguments[i] == "function"){
                mySend(ws,templates,REQUIRE_TEMPLATE);
                addEventListener(ws,ANSWER_TEMPLATE,arguments[i]);                
            }else{
                templates[i-1] = arguments[i];
            }
        }

        
            

    }

    //add an hidden field __type and, strinfy and send
    mySend = function(ws,message,messageType,extra){
        //message.__type = messageType;

        /*if(extra != 'undefined')
            for(i in extra)
                message['__' + i] = extra [i];*/
        var string = JSON.stringify({data: message, __type : messageType});
        ws.send(string);
        //console.log('I am sending: ')
        //console.log(message);
    }

function sendNewFact(ws,fact){
    fact.__type = fact.__proto__.__type;
    fact.__templateId = fact.__proto__.__templateId;
    mySend(ws,fact,NEW_FACT);
}


/*****util *******/
function indexofTemplate(type){
    for(i = 0; i < templates.length; i++)
        if(templates[i].prototype.__name.toLowerCase() === type.toLowerCase())
            return i;
    return -1;
}

function getType(message){
    return message.__type;
}


exports.require = require;
exports.registerCallback = registerCallback;
exports.registerTo = registerTo
exports.sendNewFact = sendNewFact;
exports.getType = getType;
exports.indexofTemplate = indexofTemplate;
exports.addEventListener = addEventListener;