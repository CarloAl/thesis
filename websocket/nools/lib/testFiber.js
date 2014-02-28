var mongojs = require('mongojs'),
	db = mongojs('WorkingMemory'),
	Fiber = require('fibers'),
	col = db.collection('InitialFact');

/*function doAsyncWork (id) {
  var fiber = Fiber.current;
  debugger;
  //findOne is broken
  col.find({
    _id:mongojs.ObjectId(id)},function(err,docs){
  		fiber.run(docs);
  });
  var results = Fiber.yield();
  return results;
}

function handleRequest (id) {
  Fiber(function () {
    console.log('handling request');
    var results = doAsyncWork(id);
    console.log("done " + results);
  }).run();
}*/

var id = "531052943bbf969913000002";

//{ $set: {"object.person" : 13}}

db.collection('passenger').find({
    _id:mongojs.ObjectId(id)
},function(err,docs){
	debugger;
	docs[0].object.person = 25;
	db.collection('passenger').update({
                query: { _id : mongojs.ObjectId(id) },
                update: docs[0] }, function(err, doc, lastErrorObject) {
                    debugger;
                    if(err) throw new Error("the fact to modify does not exist");
                });
});


//handleRequest(id);
//console.log("3");

/*col.find({_id : mongojs.ObjectId(id)} , function(err,docs){
  		console.log(docs);
  });*/