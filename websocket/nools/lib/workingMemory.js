"use strict";
var declare = require("declare.js"),
    LinkedList = require("./linkedList"),
    InitialFact = require("./pattern").InitialFact,
    mongojs = require('mongojs'),
    db,
    DB_NAME = "WorkingMemory",
    id = 0;


//async > 0
function getObjByMongoId(id,col,caller,cb) {
//  var fiber = Fiber.current;
  col.findOne(
    {_id : mongojs.ObjectId(id)},function(err,docs){
        console.log(caller);
        if(err) throw new Error(err);
        if(docs == null || docs == undefined){
            debugger;
            throw new Error ("couldn't find fact with id " + id);
            
        }
        //if(fiber == undefined)
          //  debugger;
        //fiber.run(docs);
        cb(docs);

    });
  //var result = Fiber.yield();
  //return result;
}


function getObj(id,col,caller,cb) {
  col.findOne({"object.objectId" : id},function(err,docs){
        console.log(caller);
        if(err) throw new Error(err);
        if(docs == null || docs == undefined){
            throw new Error ("couldn't find fact with id " + id);
            debugger;
        }
        cb(docs);

    });
}

function getCollection(obj){
    var mycollection;
    if(obj instanceof InitialFact)
        mycollection = db.collection('InitialFact');
    else
        mycollection = db.collection(obj.__type.toLowerCase());
    return mycollection;
}

var Fact = declare({

    instance: {
        constructor: function (obj) {
            this.object = obj;
            this.recency = 0;
            this.id = id++;
            var mycollection = getCollection(obj);

        },

        equals: function (fact) {
            return fact === this.object;
        },

        hashCode: function () {
            return this.id;
        }
    }

});

declare({

    instance: {

        constructor: function () {
            this.recency = 0;
            //this.facts = new LinkedList();
            this.facts = db = mongojs(DB_NAME);
            db.runCommand({dropDatabase : 1 });

        },

        dispose: function () {
            this.facts.clear();
        },



        getFacts: function (cb) {
            var collections = db.getCollectionNames(),
                ret = [],
                i = 0,
                times = 0;
                collection;
            
            var f = function(totTimes,docs){
                times++;
                if(times == totTimes){
                    cb(ret);
                }else{
                    ret.concat(docs);
                }
            }

            for(i = 0; i < collections.length; i++){
                collection = db.collection(collections[i]).find(function(err, docs) {
                    if(err)
                        throw err;
                    f(collections.length,docs);
                });
            }
        },


        getFactsByQuery: function (Template,query,cb) {
            var collection = getCollection(Template);
            collection.find(query,function(err, doc){
                cb(doc);
            });

        },

        getFactsByType: function (Template,cb) {
            var collection = getCollection(Template);
            collection.find(function(err, doc){
                cb(doc);
            });

        },

        getFactHandle: function (o,cb) {
            var collection = getCollection(o),
                result;
                //check if o is only the fact or not
            result = getObj(o._id,collection,"getFactHandle");
            debugger;
            if(o._id == undefined)
                debugger;
            if(!result || result.length == 0){
                result = new Fact(o);
                result.recency = this.recency ++ ;
            }
            return result;
        },

        modifyFactByMongoId: function (fact,cb) {
            var that = this;
            var mycollection = getCollection(fact);
            var id = fact._id;
            delete fact._id;
            getObjByMongoId(id,mycollection,"modifyFactByMongoId",function(obj){
            //obj is the object retrieved from the database, while fact is the updated version, so we update also obj and
            //then we store it in the databse
                fact.recency = that.recency++
                var id = obj.object.objectId;
                obj.object = fact;
                obj.object.objectId = id;
                mycollection.findAndModify({
                    query: { _id : obj._id },
                    update: obj }, function(err, doc, lastErrorObject) {
                        if(err) throw new Error("the fact to modify does not exist");
                            cb(obj)
                    });
                
            });
            
        },

        modifyFact: function (fact,cb) {
            var that = this;
            var mycollection = getCollection(fact);
            getObj(fact.objectId,mycollection,"modifyFact",function(obj){
            //obj is the object retrieved from the database, while fact is the updated version, so we update also obj and
            //then we store it in the databse
                fact.recency = that.recency++
                obj.object = fact;
                mycollection.findAndModify({
                    query: { _id : obj._id },
                    update: obj }, function(err, doc, lastErrorObject) {
                        if(err) throw new Error("the fact to modify does not exist");
                        cb(obj)
                    });
                
            });
            
        },

        assertFact: function (fact,cb,flow) {
            var ret = new Fact(fact);
            ret.recency = this.recency++;
            var mycollection = getCollection(fact);
            var that = this;
            mycollection.insert(ret,function(err,value){
                if(err) 
                    throw new Error(err);
                //when u assert the initial fact there's no cb
                if(cb != undefined)
                    cb(value._id, value.id,value.object.objectId);
                flow.done();
                flow.emit("assert", fact);

            });
            return ret;
        },

        retractFactByMongoId: function(id,type,cb){
            debugger;
            var mycollection = db.collection(type.toLowerCase());
            getObjByMongoId(id,mycollection,"retractFactByMongoId",cb);
            mycollection.remove({ _id : mongojs.ObjectId(id)},function(err,docs,laster){
                    if(docs.n <= 0)
                        throw new Error("the fact to remove does not exist");
                });
            
        },

        retractFact: function (fact,cb) {
            var that = this;
            var mycollection = getCollection(fact);
            var obj = getObj(fact.objectId,mycollection,"retractFact",function(obj){
            //when u retrieve obj from mongodb the obj.object.constructor is for some reason changed and the retract and modify on
            //the rete graph don't work, so we restore the original fact.
                obj.object = fact;
                mycollection.remove({ _id : obj._id},function(err,docs,laster){
                    if(docs.n <= 0)
                        throw new Error("the fact to remove does not exist");
                });
                
                cb(obj);
            });
            return fact;

        }
    }

}).as(exports, "WorkingMemory");

