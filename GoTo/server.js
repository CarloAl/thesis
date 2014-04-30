var lib  = require("./lib");
var init = require ("./init");

myVar wantToAvoid = {avoiderId, avoidedId};
myVar isA = {personId, Category};
myVar friends = {personId1, personId2};
myVar isAtPlace = {personId, placeId};
myVar isAtCoordinates = {personId, lat,long};
myVar hasCoordinates = {placeId, latBL, longBL, latUR, longUR};
myVar isGoingTo = {personId, placeId};
myVar shouldGoTo = {personId, placeId};
myVar shouldNotGoTo = {personId, placeId};
myVar isEvent = {eventId, placeId, startTime, endTime};
myVar isPartecipating = {personId, eventId};
myVar timeTable = {publicTransportation, direction, time, lat, long};
myVar goHomeBy = {personId, publicTransportation, direction};
myVar notifyCloseFriend = {personIdNotified, personIdNotification}; //should rename isCloseTo
myVar notifyPT = {personIdNotified, publicTransportation, direction, time};
myVar notifyEvent = {eventId, placeId,  startTime, endTime};	


var file = "./rule.nools";
lib.initNools(file);

//init(hasCoordinates,timeTable);
// sjs -o server.sjs -m ./macro.js server.js
