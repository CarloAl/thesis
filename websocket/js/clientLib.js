var address = 'ws://127.0.0.1:8080';

var REGISTER_TEMPLATE = 1;

//automatically generated variable used to assocate every listener 

var idListener = 0;
//function myWebSocket(address){
    ws = new WebSocket(address);
    ws.customCallBack = [];
    

    //this way you can add only one listener per type, if u add idlistener to the message to the server, then the server can send it back to dispatch to 
    //the right callback

    function registerTo(template, filter, cb){
        mySend({template: template, 
               filter: filter.toString() } , REGISTER_TEMPLATE/*,{template: template /*, idListener : idListener}*/);
        //addEventListener(idListener,cb)
        addEventListener(template,cb);
        //idListener++;
    }


    //it just tell what to do in case we receive a fact of acertain type, doesn't talk to the server
    function addEventListener(event,cb){
        ws.customCallBack[event] = cb;
    }

    
    ws.onmessage = function(message){
        message = JSON.parse(message.data);
        type = getType(message);
        console.log('Message received:');
        console.log(message);
        if(typeof ws.customCallBack[type] == 'function' )
            ws.customCallBack[type](message.data);
        else 
            console.log('no dedicated cb found for ' + type);
    }

    //add an hidden field __type and, strinfy and send
    mySend = function(message,messageType,extra){
        message.__type = messageType;
        if(extra != 'undefined')
            for(i in extra)
                message['__' + i] = extra [i];
        var string = JSON.stringify(message);
        ws.send(string);
        console.log('I am sending: ')
        console.log(message);
    }
connection = ws;
    //return ws;
//}

/*****util *******/
function indexofTemplate(type){
    for(i = 0; i < templates.length; i++)
        if(templates[i].prototype.__name.toLowerCase() === type.toLowerCase())
            return i;
    return -1;
}

function getType(message){
    if(typeof message == "string")
        return message.__type.toLowerCase();
    return message.__type;
}