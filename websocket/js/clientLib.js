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

var factId = 0
var fact;
var idListener = 0;
var objectId = 0;

function Listener(id,type){
    this.idListener = id;
    this.type = type;
    this.drop = dropListener;
}

function dropListener(){
    mySend({id: this.idListener, type : this.type} , DROP_REGISTRATION);
}
//automatically generated variable used to assocate every listener 
var idListener = 0;
//function myWebSocket(address){
    ws = new WebSocket(address);
    ws.customCallBack = [];
    

    //this way you can add only one listener per type, if u add idlistener to the message to the server, then the server can send it back to dispatch to 
    //the right callback

    function registerTo(template, filter, cb){
        idListener++;
        var type = template.prototype.__type;
        mySend({template: type, 
               filter: filter ,id: idListener} , REGISTER_TEMPLATE);
        //addEventListener(idListener,cb)
        addEventListener(template.prototype.__type,cb);
        return new Listener(idListener, type);
    }


    //it just tell what to do in case we receive a fact of acertain type, doesn't talk to the server
    function addEventListener(event,cb){
        if(typeof event == "string")
            ws.customCallBack[event.toLowerCase()] = cb;
        else
            ws.customCallBack[event] = cb;

    }

    
    ws.onmessage = function(message){
        message = JSON.parse(message.data);
        type = getType(message);
        if(typeof type == "string")
            type = type.toLowerCase();
        console.log('Message received:');
        console.log(message);
        if(typeof ws.customCallBack[type] == 'function' ){
            if(type == ANSWER_TEMPLATE){
                var templatesString = message.data;
                Templates = [];
                for(var i = 0 ; i < templatesString.length; i++){
                    eval("Templates[i] = " + templatesString[i].template);
                    Templates[i].prototype.__type = templatesString[i].__type;
                }
                ws.customCallBack[type].apply(null,[null].concat(Templates)); //the second null is the error

            }else{
                ws.customCallBack[type](message.data);
            }

        }else 
            console.log('no dedicated cb found for ' + type);
    }


    function require(){
        var templates = [];
        for (var i = 0; i < arguments.length; i++) {
            if(typeof arguments[i] == "function"){
                mySend(templates,REQUIRE_TEMPLATE);
                addEventListener(ANSWER_TEMPLATE,arguments[i]);
                addEventListener(ANSWER_TEMPLATE_NOT_FOUND,arguments[i]);
            }else{
                templates[i] = arguments[i];
            }
        }

        /*mySend(template,REQUIRE_TEMPLATE);
        toRemove = template;
        addEventListener(ANSWER_TEMPLATE,cb);*/
            

    }

    //add an hidden field __type and, strinfy and send
    mySend = function(message,messageType,extra){
        //message.__type = messageType;

        /*if(extra != 'undefined')
            for(i in extra)
                message['__' + i] = extra [i];*/
        
        var string = JSON.stringify({data: message, __type : messageType});

        ws.send(string);
        console.log('I am sending: ')
        console.log(message);
    }

function sendUpdate(update){
    //fact.mongoId = factId;
    for(i in update){
        fact[i] = update[i];
    }
    mySend(fact,UPDATE_FACT);
}


function saveId(ids){
//    factId = id;
    fact._id = ids._id;
    //fact.objectId = ids.objectId;
    //fact.id = ids.id;
}

function retractFact(){
	mySend({id:fact._id, type: fact.__type} ,RETRACT_FACT);
}

function sendNewFact(newFact){
    newFact.__type = newFact.__proto__.__type;
    newFact.__templateId = newFact.__proto__.__templateId;
    fact = newFact;
    mySend(fact,NEW_FACT);
    addEventListener(NEW_FACT_ID,saveId)
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