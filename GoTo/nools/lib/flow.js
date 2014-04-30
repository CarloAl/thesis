"use strict";
var extd = require("./extended"),
    bind = extd.bind,
    declare = extd.declare,
    nodes = require("./nodes"),
    EventEmitter = require("events").EventEmitter,
    wm = require("./workingMemory"),
    WorkingMemory = wm.WorkingMemory,
    ExecutionStragegy = require("./executionStrategy"), 
    promise = require("promise-extended"),
    nextTick = require("./nextTick"),
    AgendaTree = require("./agenda");

module.exports = declare(EventEmitter, {

    instance: {

        name: null,

        executionStrategy: null,

        asyncAction: 0,

        constructor: function (name, conflictResolutionStrategy,flowContainer) {
            this.env = null;
            this.name = name;
            this.__rules = {};
            this.flowContainer = flowContainer;
            this.conflictResolutionStrategy = conflictResolutionStrategy;
            this.workingMemory = new WorkingMemory(flowContainer);
            this.agenda = new AgendaTree(this, conflictResolutionStrategy);
            this.agenda.on("fire", bind(this, "emit", "fire"));
            this.agenda.on("focused", bind(this, "emit", "focused"));
            this.rootNode = new nodes.RootNode(this.workingMemory, this.agenda);
            extd.bindAll(this, "halt", "assert", "retract", "modify", "focus", "emit", "getFacts",
                "increaseNumberAsyncAction","getAsyncAction","done","modifyByMongoId");
        },

        getFacts: function (Type,query,cb) {
            if (Type) {
                if(query)
                    this.workingMemory.getFactsByQuery(Type,query,cb);
                else
                    this.workingMemory.getFactsByType(Type,cb);
            } else {
                this.workingMemory.getFacts(cb);
            }
        },

        focus: function (focused) {
            this.agenda.setFocus(focused);
            return this;
        },

        halt: function () {
            var strategy = this.executionStrategy;
            if (strategy.matchUntilHalt) {
                strategy.halt();
            }
            return this;
        },

        dispose: function () {
            this.workingMemory.dispose();
            this.agenda.dispose();
            this.rootNode.dispose();
        },

        assert: function (fact,cb) {
            var that = this;
            this.increaseNumberAsyncAction();
            //Fiber(function(){
                that.rootNode.assertFact(that.workingMemory.assertFact(fact,cb,that));
            //}).run();
            return fact;
        },

        setGlobalPromise: function (){
            agenda.setGlobalPromise(globalPromise);
        },

        increaseNumberAsyncAction: function(){
            this.asyncAction++;
            //if I call a modify or retract from outside nools, I need to prevent that some rule fire while I update
            //the db
            //could be that I am already looping and then I could have an incosistency if for example I try to retract from
            //outside a fact that is being modifying by nools.
            //if(!this.executionStrategy.isLooping())
              //  this.executionStrategy.setLooping(true);
        },

        getAsyncAction: function(){
            return this.asyncAction;
        },

        done: function(){
            this.asyncAction--;
            //console.log(this.asyncAction);
            if(this.asyncAction <= 0){
                this.asyncAction = 0;
                if(this.executionStrategy){
                    this.executionStrategy.setLooping(false);
                
                    //don't need to call the onAlter explicitely because after a done I always emit
                    nextTick(this.executionStrategy.callNext)    ; //add next tick
                }
            }
        },

        retractByMongoId: function(id,type){
            var that = this;
            this.increaseNumberAsyncAction();
            that.workingMemory.retractFactByMongoId(id,type,function(fact){
                that.retractFromMemory(that,fact);
            });
        },

        retract: function (fact) {
            //fact = this.workingMemory.getFact(fact);
            if(fact.cancel)
                fact.cancel();
            var that = this;
            this.increaseNumberAsyncAction();
            that.workingMemory.retractFact(fact,function(obj){
                if(obj)
                    that.rootNode.retractFact(obj);
                
                that.done();
                that.emit("retract", fact);
            });
        
            return fact;
        },

        retractFromMemory: function(that,fact){
            //node is single threaded
            debugger;
            if(!that.executionStrategy.isLooping()){
                that.executionStrategy.setLooping(true);
                that.rootNode.retractFact(fact);
                that.done();
                that.executionStrategy.setLooping(false);
                that.emit("retract", fact.object);
                nextTick(that.executionStrategy.onAlter);
                return fact;
            }else{
                nextTick(function(){that.helper(that,fact)});
            }
        },
        // This method is called to remove an existing fact from working memory

        
        modifyByMongoId: function (fact) {
            var that = this;
            this.increaseNumberAsyncAction();
            that.workingMemory.modifyFactByMongoId(fact,function(mongoFact){
                  that.helper(that,mongoFact);
            });
            return fact;
        },

        helper: function(that,fact){
            if(!that.executionStrategy.isLooping()){
                that.executionStrategy.setLooping(true);
                that.rootNode.modifyFact(fact);
                that.done();
                that.executionStrategy.setLooping(false);
                that.emit("modify", fact.object);
                nextTick(that.executionStrategy.onAlter);
                return fact;
            }else{
                nextTick(function(){that.helper(that,fact)});
            }
        },

        modify: function (fact, cb) {
            this.increaseNumberAsyncAction();
            if ("function" === typeof cb) {
                cb.call(fact, fact);
            }
            var that = this;
            that.workingMemory.modifyFact(fact,function(fact){
                that.rootNode.modifyFact(fact);
                that.done();
                that.emit("modify", fact.object);
                return fact;
            });
            return fact;
        },

        print: function () {
            this.rootNode.print();
        },

        containsRule: function (name) {
            return this.rootNode.containsRule(name);
        },

        ruleAtRunTime: function(rule){
            this.rootNode.assertRuleAtRunTime(rule);
        },

        rule: function (rule) {
            this.rootNode.assertRule(rule);
        },

        matchUntilHalt: function (cb) {
            return (this.executionStrategy = new ExecutionStragegy(this, true)).execute().classic(cb).promise();
        },

        match: function (cb) {
            return (this.executionStrategy = new ExecutionStragegy(this)).execute().classic(cb).promise();
        }

    }
});