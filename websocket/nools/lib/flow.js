"use strict";
var extd = require("./extended"),
    bind = extd.bind,
    declare = extd.declare,
    nodes = require("./nodes"),
    EventEmitter = require("events").EventEmitter,
    wm = require("./workingMemory"),
    WorkingMemory = wm.WorkingMemory,
    ExecutionStragegy = require("./executionStrategy"),
    Fiber = require('fibers'),
    promise = require("promise-extended"),
    nextTick = require("./nextTick"),
    AgendaTree = require("./agenda");

var globalPromise = undefined;
var functions = [];
var nDone = 0;

function done(){
    if(++nDone == functions.length){
        globalPromise.callback();
    }
    functions = [];
    nDone = 0;
}



module.exports = declare(EventEmitter, {

    instance: {

        name: null,

        executionStrategy: null,

        asyncAction: 0,

        constructor: function (name, conflictResolutionStrategy) {
            this.env = null;
            this.name = name;
            this.__rules = {};
            this.conflictResolutionStrategy = conflictResolutionStrategy;
            this.workingMemory = new WorkingMemory();
            this.agenda = new AgendaTree(this, conflictResolutionStrategy);
            this.agenda.on("fire", bind(this, "emit", "fire"));
            this.agenda.on("focused", bind(this, "emit", "focused"));
            this.rootNode = new nodes.RootNode(this.workingMemory, this.agenda);
            extd.bindAll(this, "halt", "assert", "retract", "modify", "focus", "emit", "getFacts","increaseNumberAsyncAction","getAsyncAction","done");
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
        },

        getAsyncAction: function(){
            return this.asyncAction;
        },

        done: function(){
            this.asyncAction--;
            if(this.asyncAction == 0){
                this.executionStrategy.setLooping(false);
                this.executionStrategy.onAlter(); //add next tick
            }
        },

        retract: function (fact) {
            //fact = this.workingMemory.getFact(fact);
            
            var that = this;
            this.increaseNumberAsyncAction();
            that.workingMemory.retractFact(fact,function(fact){
                that.rootNode.retractFact(fact);
                that.emit("retract", fact);
                that.done();
            });
        
            return fact;
        },

        // This method is called to remove an existing fact from working memory
        _retract: function (fact) {
            //fact = this.workingMemory.getFact(fact);
            var that = this;
            //if (Fiber.current){
                that.rootNode.retractFact(that.workingMemory.retractFact(fact));
                that.emit("retract", fact);
                return fact;
            /*}else{
                Fiber(function(){
                    that.rootNode.retractFact(that.workingMemory.retractFact(fact));
                    that.emit("retract", fact);
                    return fact;
                }).run();*/
            

            /*this.rootNode.retractFact(this.workingMemory.retractFact(fact));
            this.emit("retract", fact);
            return fact;*/
        },


        modify: function (fact, cb) {
            if ("function" === typeof cb) {
                cb.call(fact, fact);
            }
            var that = this;
            that.workingMemory.modifyFact(fact,function(fact){
                that.rootNode.modifyFact(fact);
                that.emit("modify", fact);
                return fact;
            });
            return fact;
        },
        // This method is called to alter an existing fact.  It is essentially a
        // retract followed by an assert.
        _modify: function (fact) {
            
            var that = this;
            
                that.rootNode.modifyFact(that.workingMemory.modifyFact(fact));
                that.emit("modify", fact);
                return fact;
            //}).run();
            /*if ("function" === typeof cb) {
                cb.call(fact, fact);
            }
            this.rootNode.modifyFact(this.workingMemory.modifyFact(fact));
            this.emit("modify", fact);
            return fact;*/

        },

        print: function () {
            this.rootNode.print();
        },

        containsRule: function (name) {
            return this.rootNode.containsRule(name);
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