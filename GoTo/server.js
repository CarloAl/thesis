var lib  = require("./lib");

myVar wantToAvoid = {avoiderId, avoidedId};
myVar isA = {personId, Catagory};
myVar friends = {personId1, personId2};
myVar isAtPlace = {personId, placeId};
myVar isAtCoordinates = {personId, lat,long};
myVar hasCoordinates = {placeId, latBL, longBL, latUR, longUR};
myVar isGoingTo = {personId, placeId};
myVar shouldGoTo = {personId, placeId};
myVar shouldNotGoTo = {personId, placeId};
myVar isEvent = {eventId, name, placeId, startTime, endTime};
myVar isPartecipating = {personId, eventId};
myVar timeTable = {publicTransportation, direction, time, lat, long};
myVar goHomeBy = {personId, publicTransportation, direction};
myVar notifyCloseFriend = {personIdNotified, personIdNotification};
myVar notifyPT = {personIdNotified, publicTransportation, direction, time};


var file = "./rule.nools";
lib.initNools(file);

// sjs -o server.sjs -m ./macro.js server.js