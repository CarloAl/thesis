var twitter = require('./stream');
var distance = require('./distance');

var taxi = [];
var passenger = [];

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

twitPassenger.stream('statuses/filter', {'track':hashtagPassenger}, function(stream) {
  stream.on('data', function (data) {
    console.log("\n passenger found");
    var newPassenger = readData(data,data.coordinates != null);
    var found = checkNewElement(newPassenger,taxi,true);
    if(!found){
      passenger.push(newPassenger);
      console.log("\n passenger length: " + passenger.length);  
    }
    console.log("\n\n\n");
  });
});  

function checkDistance(lat1,lon1,lat2,lon2,radius){
  if(distance(lat1,lon1,lat2,lon2) <= radius)
    return true
  return false;
}



twitTaxi.stream('statuses/filter', {'track': hashtagTaxi}, function(stream) {
  stream.on('data', function (data) {
      console.log("\n taxi found");
      var  newTaxi = readData(data,data.coordinates != null);
      var found = checkNewElement(newTaxi,passenger,false);
      if(!found){
        taxi.push(newTaxi);
        console.log("\n taxi length: " + taxi.length);
      }
      console.log("\n\n\n");
  });
});

//first time has to be less or equal than second time
//hypothesis : it's the passenger who wait for the taxi
function timeOk(firstTime, secondTime,isPassenger){
  if(!isPassenger)
    firstTime = [secondTime, secondTime = firstTime][0]; //swap variables
  var firstMin = getMin(firstTime);
  var firstHour = getHour(firstTime);
  var secondMin = getMin(secondTime);
  var secondHour = getHour(secondTime);
  if(firstHour <= secondHour || (firstHour == secondHour && firstMin <= secondMin))
    return true;
  else 
    return false;
}

function getMin(time){
  return (time.split(':'))[1];
}

function getHour(time){
  return (time.split(':'))[0];
}

//if the number of seat claimed is smaller than the number of seat offered
function checkDifferenceSeats(element,array,isPassenger){
  debugger;
  if(isPassenger){
    lift = array;
    passenger = element;
  }else{
    lift = element;
    passenger = array;
  }
  if(lift.person > passenger.person){
    lift.person = lift.person - passenger.person;
    var msg = "#offerRide " + lift.destination + " " + lift.time + " " + lift.radius + " " + lift.person + " " +
               lift.maxPrice + " " + lift.long + " " + lift.lat;
    twitTaxi.verifyCredentials(function (err, data) {
              console.log(data);
          }).updateStatus(msg,function (err, data) {
              console.log(err);
          });
    taxi.push(lift);
    //the old one gets removed in checkNewElement
  }

}

function checkNewElement(element,array,isPassenger){
  var found = false;
  //TODO: find the best one, not the first one that fits
  for(var i = 0 ; i < array.length && !found; i++){
    debugger;
    if(array[i].destination === element.destination && timeOk(element.time,array[i].time,isPassenger) 
      && isPassenger?array[i].person >= element.person: element.person >= array[i].person &&
      checkDistance(array[i].lat, array[i].long, element.lat,element.long,Math.min(array[i].radius,element.radius)) && 
        isPassenger?array[i].maxPrice <= element.maxPrice:element.maxPrice <= array[i].maxPrice){
          found = true;
          
          checkDifferenceSeats(element,array[i],isPassenger);
          
          var passengerMsg = getStringPassenger(element,array[i],isPassenger);
          var taxiMsg      = getStringTaxi(element,array[i],isPassenger);
          console.log("found matching ");
          twitTaxi.verifyCredentials(function (err, data) {
              console.log(data);
          }).updateStatus(passengerMsg,function (err, data) {
              console.log(err);
          }).updateStatus(taxiMsg,function (err, data) {
              console.log(err);
       });
      //remove the 
       array.splice(i,1);
    } 
  }
  return found;
}


/*
function checkTaxi(passenger){
  var found = false;
  console.log("\n checking taxis for the new passenger");
  console.log("\n taxi length: " + taxi.length );
  //TODO: find the best one, not the first one that fits
  for(var i = 0 ; i < taxi.length && !found; i++){
    debugger;
    if(taxi[i].destination === passenger.destination && timeOk(passenger.time,taxi[i].time) && taxi[i].person >= passenger.person &&
      checkDistance(taxi[i].lat, taxi[i].long, passenger.lat,passenger.long,Math.min(taxi[i].radius,passenger.radius)) && 
        taxi[i].maxPrice <= passenger.maxPrice){
          found = true;
          var passengerMsg = getStringPassenger(passenger.userName,taxi[i].lat,taxi[i].long,taxi[i].userName,taxi[i].time);
          var taxiMsg      = getStringTaxi(taxi[i].userName,passenger.person,taxi[i].destination,passenger.userName);
          console.log("found matching taxi");
          twitTaxi.verifyCredentials(function (err, data) {
              console.log(data);
          }).updateStatus(passengerMsg,function (err, data) {
              console.log(err);
          }).updateStatus(taxiMsg,function (err, data) {
              console.log(err);
       });
      //remove the taxi
       taxi.splice(i,1);
    } 
  }
  return found;
}
*/

//fill up the taxi, if 2 passenger take a cab for 4
//esper
//meteor
/*
function checkPassenger(taxi){
  console.log("\nchecking passengers for the new taxi");
  console.log("\npass length: " + passenger.length );
  var found = false;
  for(var i = 0 ; i < passenger.length && !found ; i++){
    debugger;
    if(taxi.destination === passenger[i].destination && timeOk(passenger[i].time,taxi.time) && taxi.person >= passenger[i].person &&
      checkDistance(taxi.lat, taxi.long, passenger[i].lat,passenger[i].long,Math.min(taxi.radius,passenger[i].radius)) && 
        taxi.maxPrice <= passenger[i].maxPrice){
       console.log("found matching passenger");
       found = true;
       var passengerMsg = getStringPassenger(passenger[i].userName,taxi.lat,taxi.long,taxi.userName,taxi.time);
       var taxiMsg      = getStringTaxi(taxi.userName,passenger[i].person,taxi.destination,passenger[i].userName);
       twitTaxi.verifyCredentials(function (err, data) {
              console.log(data);
        }).updateStatus(passengerMsg,function (err, data) {
            console.log(err);
        }).updateStatus(taxiMsg,function (err, data) {
              console.log(err);;
        });
        //remove the passenger
        passenger.splice(i,1);
    }
  }
  return found;
}
*/

function getStringTaxi(element,array,isPassenger){
  //if is passenger ttrue means that element is a passenger
  if(isPassenger){
    username = array.userName;
    person = element.person;
    destination = array.destination;
    contact = element.userName;
  }else{
    username = element.userName;
    person = array.person;
    destination = element.destination;
    contact = array.userName;
  }
  return '@'+username + ' ' + person +' person found for ' + destination +' contact: ' + contact;
}

function getStringPassenger(element,array,isPassenger){
  //if isPassenger then element contain the passenger
  if(!isPassenger){
    var taxi;
    username = array.userName;
    lat = element.lat;
    long = element.long;
    taxi = element.userName;
    time = element.time;
  }else{
    username = element.userName;
    lat = array.lat;
    long = array.long;
    taxi = array.userName;
    time = array.time;
  }
  return '@'+ username + ' lift found at lat:'+ lat +' long: '+ long + ' by: ' + taxi + ' at '+ time;
}


/*function getStringTaxi(username, person, destination , contact){
  return '@'+username + ' ' + person +' person found for ' + destination +' contact: ' + contact;
}

function getStringPassenger(username, lat, longi , taxi,time){
  return '@'+ username + ' lift found at lat:'+ lat +' long: '+ longi + ' by: ' + taxi + ' at '+ time;
}*/



setTimeout(function(){
  twitTaxi.verifyCredentials(function (err, data) {
              console.log(err);
          }).updateStatus('#offerRide VUB 14:21 5 5 10 4.3973331 50.8462136',function (err, data) {
              console.log(err + '\n' +data);
              console.log("\ntweet offer ride sent");
          });
},1000)
setTimeout(function(){
  twitTaxi.verifyCredentials(function (err, data) {
              console.log(err);
          }).updateStatus('#LFlift VUB 14:20 5 4 10 4.3973332 50.8462136',{display_coordinates: 'true'},function (err, data) {
              //console.log(data);
              console.log("\n tweet lf ride sent");
          });
},2000)

//home coordinates long: 4.3973332,
//                 lat: 50.8462136,
function readData(data,coordinates){
  var tmp = new Object ();
  var arr = data.text.split(" ");
  tmp.destination = arr[1];
  tmp.time = arr[2];
  tmp.radius = arr[3];
  tmp.person = arr[4];
  tmp.maxPrice = arr[5];
  if(coordinates){
    tmp.long = data.coordinates.coordinates[0];
    tmp.lat = data.coordinates.coordinates[1];
  }else{
    tmp.long = arr[6];
    tmp.lat = arr[7];
  }
  tmp.userName = data.user.screen_name;
  tmp.userId = data.user.id_str;
  
  return tmp;
}