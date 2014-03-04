"use strict";
var declare = require("declare.js"),
    LinkedList = require("./linkedList"),
    InitialFact = require("./pattern").InitialFact,
    mongojs = require('mongojs'),
    Fiber = require('fibers'),
    db,
    DB_NAME = "WorkingMemory",
    id = 0;


/*function getSyncCollection(obj){
    var mycollection;
    if(obj instanceof InitialFact)
        mycollection = mongosync.db(DB_NAME).getCollection('InitialFact');
    else
        mycollection = mongosync.db(DB_NAME).getCollection(obj.__type);
    return mycollection;
}*/

function getObj (id,col,caller) {
  var fiber = Fiber.current;
  
  //findOne is broken
  col.findOne(
    {"object.objectId" : id},function(err,docs){
        console.log(caller);
        if(err) throw new Error(err);
        if(docs == null || docs == undefined)
            throw new Error ("couldn't find fact with id " + id);
        if(fiber == undefined)
            debugger;
        fiber.run(docs);

    });
  var result = Fiber.yield();
  return result;
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
                /*,function(err,doc){
                if(doc)
                    cb(doc);
                else{
                    var obj = new Fact(o);
                    obj.recency = recency ++ ;
                }
            })
            /*while ((head = head.next)) {
                var existingFact = head.data;
                if (existingFact.equals(o)) {
                    return existingFact;
                }
            }
            if (!ret) {
                ret = new Fact(o);
                ret.recency = this.recency++;
                //this.facts.push(ret);
            }
            return ret;*/
        },

        modifyFact: function (fact) {
            var mycollection = getCollection(fact);
            var obj = getObj(fact.objectId,mycollection,"modifyFact");
            //obj is the object retrieved from the database, while fact is the updated version, so we update also obj and
            //then we store it in the databse
            obj.object = fact;
            mycollection.findAndModify({
                query: { _id : obj._id },
                update: obj }, function(err, doc, lastErrorObject) {
                    if(err) throw new Error("the fact to modify does not exist");
                });
            
            return obj;
            /*while ((head = head.next)) {
                var existingFact = head.data;
                if (existingFact.equals(fact)) {
                    existingFact.recency = this.recency++;
                    return existingFact;
                }
            }*/
            //if we made it here we did not find the fact
            
        },

        assertFact: function (fact) {
            var ret = new Fact(fact);

            ret.recency = this.recency++;

            var mycollection = getCollection(fact);
            var t = mycollection.insert(ret,function(err,value){
                if(err) throw new Error(err);
            });
            return ret;
        },

        retractFact: function (fact) {
            var mycollection = getCollection(fact);
            var obj = getObj(fact.objectId,mycollection,"retractFact");
            //when u retrieve obj from mongodb the obj.object.constructor is for some reason changed and the retract and modify on
            //the rete graph don't work, so we restore the original fact.
            obj.object = fact;

            mycollection.remove({ _id : obj._id},function(err,docs,laster){
                if(docs.n <= 0)
                    throw new Error("the fact to remove does not exist");
            });
            return obj;

        }
    }

}).as(exports, "WorkingMemory");

