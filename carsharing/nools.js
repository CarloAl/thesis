
var nools = require("nools");
var twitter = require('./stream');




function tweet(taxi,passenger){
  var passengerMsg = getStringPassenger(passenger.userName,taxi.lat,taxi.long,taxi.userName,taxi.time.toLocaleTimeString());
  var taxiMsg      = getStringTaxi(taxi.userName,passenger.person,taxi.destination,passenger.userName);
  console.log("found matching ");
  twitTaxi.verifyCredentials(function (err, data) {
      console.log(data);
  }).updateStatus(passengerMsg,function (err, data) {
      console.log(err);
  }).updateStatus(taxiMsg,function (err, data) {
      console.log(err);
  });
}

var flow = nools.compile("./rule.nools",{scope: {tweet: tweet }});


  
Taxi = flow.getDefined("Taxi");
Passenger = flow.getDefined("Passenger");

var hashtagTaxi = '#offerRide';
var hashtagPassenger = '#LFLift';

var twitPassenger = new twitter({
  consumer_key: 'qJGHNOrnGZatNMs2QC25zg',
  consumer_secret: 'wpGQXZC7yk3Qd0ErgZsB17PnEGoh02ptlRBxT76yqo',
  access_token_key: '20790593-Y62EjZvIw7bzimPnN6Tvncjsj32GWMqaCxyZ4LE54',
  access_token_secret: 'REbmanxNwC7vxgtDhwBpsGsxhS1BCVxy9effRHybE'
});

var twitTaxi = new twitter({
  consumer_key: 'hBFTYYGBnJuX80vK8liOQ',
  consumer_secret: 'xceNYnhmdxK1XTKJISEmviYafovBrBN98u7oBuhfw',
  access_token_key: '1871041333-fT4dGov5qIXCiJfmrBPzfsNahcibpz6xYvDLafy',
  access_token_secret: '5gKUBg3r793qaGSuOXrys7kqZf40EiBgK7Bh6zM'
});

var session1 = flow.getSession();


twitPassenger.stream('statuses/filter', {'track':hashtagPassenger}, function(stream) {
  stream.on('data', function (data) {
    console.log("\n passenger found");
    var newPassenger = readData(data,data.coordinates != null);
    //no need to do that, now the engine will do it
    /*var found = checkNewElement(newPassenger,taxi,true);
    if(!found){
      passenger.push(newPassenger);
      console.log("\n passenger length: " + passenger.length);  
    }*/
    var date = new Date();
    date.setMinutes((newPassenger.time.split(':'))[1]);
    date.setHours((newPassenger.time.split(':'))[0]);
    var aPassenger = new Passenger({destination : newPassenger.destination, time : date, radius : newPassenger.radius , 
      person : newPassenger.person , maxPrice: newPassenger.maxPrice,
      long: newPassenger.long,   lat: newPassenger.lat,  userName: newPassenger.userName, matched : false });
    
    console.log("\n" + aPassenger);
    console.log("\n" + session1.assert(aPassenger));
    //console.log("\n" + session1.assert(p1));
  });
});  

function checkDistance(lat1,lon1,lat2,lon2,radius){
  if(distance(lat1,lon1,lat2,lon2) <= radius)
    return true
  return false;
}


function getStringTaxi(username, person, destination , contact){
  return '@'+username + ' ' + person +' person found for ' + destination +' contact: ' + contact;
}

function getStringPassenger(username, lat, longi , taxi,time){
  return '@'+ username + ' lift found at lat:'+ lat +' long: '+ longi + ' by: ' + taxi + ' at '+ time;
}

emitTweet = function(passenger,taxi){

}

twitTaxi.stream('statuses/filter', {'track': hashtagTaxi}, function(stream) {
  stream.on('data', function (data) {
      console.log("\n taxi found");
      var  newTaxi = readData(data,data.coordinates != null);
      var date = new Date();
      date.setMinutes((newTaxi.time.split(':'))[1]);
      date.setHours((newTaxi.time.split(':'))[0]);
      var aTaxi = new Taxi({destination : newTaxi.destination, time : date, radius : newTaxi.radius , 
      person : newTaxi.person , maxPrice: newTaxi.maxPrice,
      long: newTaxi.long,   lat: newTaxi.lat,  userName: newTaxi.userName, matched : false });
      debugger;
      console.log("\n" + aTaxi);
      session1.assert(aTaxi);
      //console.log("\n" + session1.assert(t1));
      
  });
});



t1 = new Taxi({destination : 'VUB', time : new Date (2013,10,13,14,20), radius : 5 , person : 5 , maxPrice: 5,
    long: 4.3973331,   lat: 50.8462136,  userName: 'carsharing2', matched : false });

t2 = new Taxi({destination : 'HUB', time : new Date (2013,10,13,14,20), radius : 5 , person : 5 , maxPrice: 5,
    long: 4.3973331,   lat: 50.8462136,  userName: 'carsharing2', matched : false });

p1 = new Passenger({destination : 'VUB', time : new Date (2013,10,13,14,10), radius : 5 , person : 5 , maxPrice: 5,
    long: 4.3973331,   lat: 50.8462136,  userName: 'carsharing2', matched : false });

p2 = new Passenger({destination : 'HUB', time : new Date (2013,10,13,14,10), radius : 5 , person : 5 , maxPrice: 5,
    long: 4.3973331,   lat: 50.8462136,  userName: 'carsharing2', matched : false });

/*session1.assert(t1);
session1.assert(t2);
debugger;
session1.assert(p1);
session1.assert(p2);
*/
session1.matchUntilHalt()
    .then(
        function(){
            //all done!
        },
        function(err){
            console.log(err.stack);
        }
    );

function readData(data,coordinates){
  var tmp = new Object ();
  var arr = data.text.split(" ");
  tmp.destination = arr[1];
  tmp.time = arr[2];
  tmp.radius = Number(arr[3]);
  tmp.person = Number(arr[4]);
  tmp.maxPrice = Number(arr[5]);
  if(coordinates){
    tmp.long = Number(data.coordinates.coordinates[0]);
    tmp.lat = Number(data.coordinates.coordinates[1]);
  }else{
    tmp.long = Number(arr[6]);
    tmp.lat = Number(arr[7]);
  }
  tmp.userName = data.user.screen_name;
  tmp.userId = data.user.id_str;
  
  return tmp;
}


setTimeout(function(){
  twitTaxi.verifyCredentials(function (err, data) {
              console.log(err);
          }).updateStatus('#offerRide VUB 14:33 8 4 7 4.3973331 50.8462136',function (err, data) {
              //console.log(err + '\n' + data);
              console.log("\ntweet offer ride sent");
          });
},1000)
setTimeout(function(){
  twitTaxi.verifyCredentials(function (err, data) {
              console.log(err);
          }).updateStatus('#LFlift VUB 14:23 6 4 5 4.3973331 50.8462136',{display_coordinates: 'true'},function (err, data) {
              //console.log(data);
              console.log("\n tweet lf ride sent");
          });
},2000)

/*
setTimeout(function(){
  twitTaxi.verifyCredentials(function (err, data) {
              console.log(err);
          }).updateStatus('#offerRide softlab 14:30 8 5 5 4.3973331 50.8462136',function (err, data) {
              
              console.log("\ntweet offer ride sent");
          });
},1200)

setTimeout(function(){
  twitTaxi.verifyCredentials(function (err, data) {
              console.log(err);
          }).updateStatus('#LFlift VUB 14:20 6 1 5 4.3973331 50.8462136',{display_coordinates: 'true'},function (err, data) {
              //console.log(data);
              console.log("\n tweet lf ride sent");
          });
},2200)
/*
setTimeout(function(){
  twitTaxi.verifyCredentials(function (err, data) {
              console.log(err);
          }).updateStatus('#LFlift ULB 14:20 7 10 5 4.3973331 50.8462136',{display_coordinates: 'true'},function (err, data) {
              //console.log(data);
              console.log("\n tweet lf ride sent");
          });
},2200)
*/
//rember the persistence, and fine graining search like i know u are vegetarian and i'll sort the restaurant with vegetarian first