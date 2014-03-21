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
var SEND_FACT_FOR_TEMPLATE = 9;

var factId = 0
var fact;
var idListener = 0;
var objectId = 0;

function Listener(id,type){
    this.idListener = id;
    this.type = type;
    this.drop = dropListener;
}

var registerCallback = [];

function dropListener(){
    mySend({id: this.idListener, type : this.type} , DROP_REGISTRATION);
}

function newFact(obj){

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
        registerCallback[idListener] = cb;
        return new Listener(idListener, type);
    }


    //it just tell what to do in case we receive a fact of acertain type, doesn't talk to the server
    function addEventListener(event,cb){
        if(typeof event == "string")
            ws.customCallBack[event.toLowerCase()] = cb;
        else
            ws.customCallBack[event] = cb;

    }

function defineTemplate(name,obj){
    var template = function (opts){
        opts = opts || {};
        for (var i in opts) {
            if (i in template.prototype) {
                this[i] = opts[i];
            }else{
                throw new Error(i + ' is not an attribute of '+ name+ 'fact type');
            }
        }
        this.__type = name;
        //so later on when the server answer I can save the id
        this._id = undefined;

    };
    template.prototype.__type = name;
    template.prototype.__templateId = obj.__templateId;
    template.__type = name;
    template.__templateId = obj.__templateId;
    //if(options.automaticallyAsserted == true)
    //  template.automaticallyAsserted = true;
    for(i in obj){
        template.prototype[i] = 'not yet instantiated'
    }
    return template;
}

    
    ws.onmessage = function(message){
        message = JSON.parse(message.data);
        type = getType(message);
        if(typeof type == "string")
            type = type.toLowerCase();
        console.log('Message received:');
        console.log(message);
        
            if(type == ANSWER_TEMPLATE){
                var answerTemplate = message.data;
                Templates = [];
                for(var i = 0 ; i < answerTemplate.length; i++){
                    //eval("Templates[i] = " + answerTemplate[i].template);
                    Templates[i] = defineTemplate(answerTemplate[i].__type,JSON.parse(answerTemplate[i].prototype));
                    Templates[i].prototype.__type = answerTemplate[i].__type;
                    var fproxy = Proxy(Templates[i],
                        {
                            construct: function(target, args){
                                return Proxy(new target(args[0]),
                                    {   set: function(target, name, val, receiver){
                                            if(name.substring(0,2) != '__' && target[name] != val && name in target){
                                                target[name] = val;
                                                console.log('I am modifying ' + name);
                                                if(name != "_id") //in this case I am hust saving the id that the server gave me back, no need to inform the server about i
                                                    modify({name : val});
                                            }
                                        },
                                        get: function(obj, prop) {
                                            if(name.substring(0,2) != '__')
                                            // The default behavior to return the value

                                                return obj[prop];
                                        }
                                    }
                                )
                            },
                            apply:function(target,that,args) {
                                throw new Error('cannot call a type');
                            },
                            set: function(target, name, val, receiver){
                                throw new Error('cannot change value of a Fact type');
                            }

                        }
                      );
                      Templates[i] = fproxy;
                    
                }
                ws.customCallBack[type].apply(null,[null].concat(Templates)); //the second null is the error

            }else{
                if(type == SEND_FACT_FOR_TEMPLATE){
                	registerCallback[message.data.idListener](message.data.facts)
                }else{
                	ws.customCallBack[type](message.data);	
                }
            }

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
    mySend   = function(message,messageType,extra){
        //message.__type = messageType;

        /*if(extra != 'undefined')
            for(i in extra)
                message['__' + i] = extra [i];*/
        
        var string = JSON.stringify({data: message, __type : messageType});

        ws.send(string);
        console.log('I am sending: ')
        console.log(message);
    }

var modified = 0;
function modify(singleModification){
    modified ++;
    var temp = modified;
    /*if(modification)
        (for i in singleModification)
            modification[i] = singleModification[i]
    */
    setTimeout(function(){
        if(modified == temp){
            //mySend({modification: modification, id: fact._id},UPDATE_FACT);
            mySend(fact,UPDATE_FACT);
            modified = 0;
        }
            
    },2);
}

function checkDiff(obj){
    for(i in obj){
        if(fact[i] != update[i])
            fact[i] = update[i];
    }
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
    //newFact.__type = newFact.__proto__.__type;
    //newFact.__templateId = newFact.__proto__.__templateId;
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