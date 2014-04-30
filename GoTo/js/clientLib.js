var address = 'ws://127.0.0.1:8080';

var NEW_FACT                  = 1230;
var REGISTER_TEMPLATE         = 1231;
var REQUIRE_TEMPLATE          = 1232;
var ANSWER_TEMPLATE           = 1233;
var ANSWER_TEMPLATE_NOT_FOUND = 1234;
var NEW_FACT_ID               = 1235; 
var UPDATE_FACT               = 1236;
var DROP_REGISTRATION         = 1237;
var RETRACT_FACT              = 1238;
var SEND_FACT_FOR_TEMPLATE    = 1239;
var CUSTOM_RULE               = 12310;
var RULE_FIRED                = 12311;
var UPDATE_FACT_SERVER        = 12312;
var DISPOSE                   = 12313;
var USER_ID                   = 12314;
var NEW_USER_ID               = 12315;

var factId = 0
var fact
//keep all the aserted fact
var assertedFacts = [];
var idListener = 0;
var objectId = 0;
var primus;
var uid = -1;
//API
var addListener,
    bufferedMessages = [],
    requireTemplate;


requirejs.config({
    //By default load any module IDs from js/lib
    baseUrl: '../js/',
    //except, if the module ID starts with "app",
    //load it from the js/app directory. paths
    //config is relative to the baseUrl, and
    //never includes a ".js" extension since
    //the paths config could be for a directory.
    paths: {
        app: '../app'
    }
});
//http://127.0.0.1:8888/primus/primus.js
require(["../js/reflect.js","/primus/primus.js","../js/jsonfn.js"], function(reflect,Primus) { //no need to add a 3rd paramenter for jsonfn because it creates a global variable
    primus = new Primus('http://localhost:8888/' ,{
          reconnect: {
              maxDelay: Infinity // Number: The max delay for a reconnect retry.
            , minDelay: 500 // Number: The minimum delay before we reconnect.
            , retries: 10 // Number: How many times should we attempt to reconnect.
          }});


    primus.on('disconnect', function(msg){
      console.log(msg +" disconnected");
    });

    primus.on('open', function open() {
      console.log('Connection is alive and kicking');
      var string = /*JSONfn.stringify(*/{data: uid, __type : USER_ID, uid : uid};
      primus.write(string);
      for (var i = 0 ; i < bufferedMessages.length ; i++ ){
          primus.send(bufferedMessages[i]);
      };
      bufferedMessages = [];
      //send that you are done with it
      
    });


    primus.on('connection', function(msg){
      console.log(msg +" connected");
    });

    primus.on('end', function(msg){
      console.log(msg +" ended");
    }); 

    primus.on('reconnect', function () {
      console.log('Reconnect attempt started');
    });

    primus.on('reconnecting', function (opts) {
      console.log('Reconnecting in %d ms', opts.timeout);
      console.log('This is attempt %d out of %d', opts.attempt, opts.retries);
    });
    //This function is called when scripts/helper/util.js is loaded.
    //If util.js calls define(), then this function is not fired until
    //util's dependencies have loaded, and the util argument will hold
    //the module value for "helper/util".

    function Listener(id,type){
    this.idListener = id;
    this.type = type;
    this.drop = dropListener;
    }

    var registerCallback = [];

    function dropListener(){
        mySend({id: this.idListener, type : this.type} , DROP_REGISTRATION);
    }

    var rules = [];

    //automatically generated variable used to assocate every listener 
    var idListener = 0;
    //function myWebSocket(address){
        //ws = new WebSocket(address);
        primus.customCallBack = [];
        

        function Rule(name,constraint,tempAction,localAction){
            this.name = name;
            this.constraint = constraint;
            if(Array.isArray(constraint[0])){
                    for (var i = constraint.length - 1; i >= 0; i--) {
                        constraint[i][0] = constraint[i][0].__type;
                    }
                }else{
                    constraint[0] = constraint[0].__type;
                }
            this.notifyMe = tempAction.toString().indexOf("notifyMe()") > -1 ? true:false;
            this.action = function(facts){
                var vars = [];
                //save the variable used by the rule in the scope
                if(Array.isArray(constraint[0])){
                    for (var i = constraint.length - 1; i >= 0; i--) {
                        vars.push(constraint[i][1]);
                    }
                }else{
                    vars.push(constraint[1])
                }
                for (var i = vars.length - 1; i >= 0; i--) {
                    eval(vars[i] + ' = facts.'+ vars[i]);
                }
                var entire = tempAction.toString(); 
                var body = entire.slice(entire.indexOf("{") + 1, entire.lastIndexOf("}"));
                //this way I have in scope the variable of the rule
                new Function(body)();
            }
            this.localAction = localAction;
        }

        function assertRule(rule){
            rules[rule.name] = rule;
            mySend(rule,CUSTOM_RULE);
        }

        //this way you can add only one listener per type, if u add idlistener to the message to the server, then the server can send it back to dispatch to 
        //the right callback

        function registerTo(template, filter, cb){
            idListener++;
            var type = template.prototype.__type;
            mySend({template: type, 
                   filter: filter ,id: idListener} , REGISTER_TEMPLATE);
            //addListener(idListener,cb)
            registerCallback[idListener] = cb;
            return new Listener(idListener, type);
        }


        //it just tell what to do in case we receive a fact of acertain type, doesn't talk to the server
        addListener = function (event,cb){
            if(typeof event == "string")
                primus.customCallBack["__custom__" +event.toLowerCase()] = cb;
            else
                primus.customCallBack["__custom__" +event] = cb;

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
            this.objectId = objectId++
            this.__type = name;
            //so later on when the server answer I can save the id
            this._id = undefined;

        };
        template.prototype.__type = name;
        template.prototype.__templateId = obj.__templateId;
        template.prototype.retract = function(){
            debugger;
            retractFact(this._id, this.__type);
        }
        template.__type = name;
        template.__templateId = obj.__templateId;
        //if(options.automaticallyAsserted == true)
        //  template.automaticallyAsserted = true;
        for(i in obj){
            template.prototype[i] = 'not yet instantiated'
        }
        return template;
    }

        
    primus.on("data", function(message){
        message = JSONfn.parse(message);
        type = getType(message);
        if(typeof type == "string")
            type = type.toLowerCase();
        console.log('Message received:');
        console.log(message);
        switch(type){
            case NEW_USER_ID:
                uid = message.data;
                console.log("New uid " +uid);
                break;
            case ANSWER_TEMPLATE:
                var answerTemplate = message.data;
                Templates = [];
                for(var i = 0 ; i < answerTemplate.length; i++){
                    //eval("Templates[i] = " + answerTemplate[i].template);
                    Templates[i] = defineTemplate(answerTemplate[i].__type,JSON.parse(answerTemplate[i].prototype));
                    Templates[i].prototype.__type = answerTemplate[i].__type;
                    var fproxy = Proxy(Templates[i],
                        {
                            construct: function(target, args){
                                var fact = new target(args[0]);
                                assertedFacts[fact.objectId] = fact;
                                //args[1] is the option
                                sendNewFact(fact,args[1]);                                                
                                
                                
                                var proxy = Proxy(fact,
                                        {  set: function(target, name, val, receiver){
                                            if(name.substring(0,2) != '__' && target[name] != val && name in target){
                                                target[name] = val;
                                                console.log('I am modifying ' + name);
                                                if(name != "_id") //in this case I am hust saving the id that the server gave me back, no need to inform the server about i
                                                    modify({name : val});
                                            }
                                        },
                                        get: function(obj, prop) {
                                            //if(prop.substring(0,2) != '__')
                                            // The default behavior to return the value

                                                return obj[prop];
                                        }
                                    }
                                );
                                return proxy;
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
                primus.customCallBack["__custom__" +type].apply(null,[null].concat(Templates)); //the second null is the error

                break;
            case SEND_FACT_FOR_TEMPLATE:
                registerCallback[message.data.idListener](message.data.facts)
                break;
            case RULE_FIRED: 
                var facts = message.data.facts;
                var ruleName = message.data.ruleName;
                rules[ruleName](facts);
                break;
            case UPDATE_FACT_SERVER :
                var updatedFact = message.data;
                var oldFact = assertedFacts[updatedFact.__clientObjectId];
                for(i in updatedFact)
                    if(oldFact.hasOwnProperty(i) && i.substring(0,2) != "__" && i!= "objectId")
                        oldFact[i] = updatedFact[i];
                break;
                //if there's a callback registered on the onModify, call it
                if(fact.onModify)
                    fact.onModify();
            default:
                if(typeof primus.customCallBack["__custom__" +type] == "function")
                    primus.customCallBack["__custom__" + type](message.data);  
                else{
                    debugger;
                    throw new Error ( "No customCallBack for " + type);
                }
                
            }

        });


        requireTemplate = function (){
            var templates = [];
            for (var i = 0; i < arguments.length; i++) {
                if(typeof arguments[i] == "function"){
                    mySend(templates,REQUIRE_TEMPLATE);
                    addListener(ANSWER_TEMPLATE,arguments[i]);
                    addListener(ANSWER_TEMPLATE_NOT_FOUND,arguments[i]);
                }else{
                    templates[i] = arguments[i];
                }
            }

            /*mySend(template,REQUIRE_TEMPLATE);
            toRemove = template;
            addListener(ANSWER_TEMPLATE,cb);*/
                

        }

        //add an hidden field __type and, strinfy and send
        mySend   = function(message,messageType,extra){
            //message.__type = messageType;

            /*if(extra != 'undefined')
                for(i in extra)
                    message['__' + i] = extra [i];*/
            if(uid == -1){
                setTimeout(mySend,700,message,messageType,extra);
            }else{
                var string = /*JSONfn.stringify(*/{data: message, __type : messageType, uid : uid};
                if(primus.socket.readyState != primus.socket.OPEN)
                    bufferedMessages.push(string);
                else
                    primus.write(string);
                console.log('I am sending: ')
                console.log(message);    
            }
            
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
        //fact._id = ids._id;

        assertedFacts[ids.clientId]._id = ids._id; //mongo id, used later for retract and modify
        //fact.objectId = ids.objectId;
        //fact.id = ids.id;
    }

    function retractFact(id,type){
        mySend({id:id, type: type} ,RETRACT_FACT);
    }

    function sendNewFact(newFact,options){
        //newFact.__type = newFact.__proto__.__type;
        //newFact.__templateId = newFact.__proto__.__templateId;
        fact = newFact;
        mySend({fact:fact, opts: options},NEW_FACT);
        addListener(NEW_FACT_ID,saveId)
    }


    /*****util *******/
    function indexofTemplate(type){
        for(i = 0; i < templates.length; i++)
            if(templates[i].prototype.__name.toLowerCase() === type.toLowerCase())
                return i;
        return -1;
    }


    function dispose(){
        mySend({},DISPOSE);
    }

    
    function getType(message){
        return message.__type;
    }

    if(typeof module != 'undefined'){
        exports.requireTemplate = requireTemplate;
        exports.dispose = dispose;
        exports.addListener = addListener;
    
    }

    return {
        addListener:addListener,
        requireTemplate: requireTemplate
    }

});

