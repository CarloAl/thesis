var lib  = require("./lib");
var init = require ("./init");

template wantToAvoid = {avoiderId, avoidedId};
template isA = {personId, Category};
template friends = {personId1, personId2};
template isAtPlace = {personId, placeId};
//template isAtCoordinates = {personId, lat,long};
template hasCoordinates = {placeId, latBL, longBL, latUR, longUR};
template isGoingTo = {personId, placeId};
template shouldGoTo = {personId, placeId};
template shouldNotGoTo = {personId, placeId};
template isEvent = {eventId, placeId, startTime, endTime};
template isPartecipating = {personId, eventId};
template timeTable = {publicTransportation, direction, time, lat, long};
template goHomeBy = {personId, publicTransportation, direction};
template notifyCloseFriend = {personIdNotified, personIdNotification}; //should rename isCloseTo
template notifyPT = {personIdNotified, publicTransportation, direction, time};
template notifyEvent = {eventId, placeId,  startTime, endTime};	


var file = "./rule.nools";
lib.initNools(file);

//init(hasCoordinates,timeTable);

