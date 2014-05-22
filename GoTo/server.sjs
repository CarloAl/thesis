var lib$343 = require('./lib');
var tmp$345 = {};
tmp$345['avoiderId'] = undefined;
tmp$345['avoidedId'] = undefined;
//ugly solution but the problem otherwise would be that, since this are hygenic macro, the var lib outside would be renamed so I couldn't 
//acces to it, plus nodejs cache the require object so u just have a different pointer to the same thing
var lib$346 = require('./lib');
var wantToAvoid$349 = lib$346.defineTemplate('wantToAvoid', tmp$345);
var tmp$351 = {};
tmp$351['personId'] = undefined;
tmp$351['Catagory'] = undefined;
//ugly solution but the problem otherwise would be that, since this are hygenic macro, the var lib outside would be renamed so I couldn't 
//acces to it, plus nodejs cache the require object so u just have a different pointer to the same thing
var lib$352 = require('./lib');
var isA$355 = lib$352.defineTemplate('isA', tmp$351);
var tmp$357 = {};
tmp$357['personId1'] = undefined;
tmp$357['personId2'] = undefined;
//ugly solution but the problem otherwise would be that, since this are hygenic macro, the var lib outside would be renamed so I couldn't 
//acces to it, plus nodejs cache the require object so u just have a different pointer to the same thing
var lib$358 = require('./lib');
var friends$361 = lib$358.defineTemplate('friends', tmp$357);
var tmp$363 = {};
tmp$363['personId'] = undefined;
tmp$363['placeId'] = undefined;
//ugly solution but the problem otherwise would be that, since this are hygenic macro, the var lib outside would be renamed so I couldn't 
//acces to it, plus nodejs cache the require object so u just have a different pointer to the same thing
var lib$364 = require('./lib');
var isAtPlace$367 = lib$364.defineTemplate('isAtPlace', tmp$363);
/*var tmp$369 = {};
tmp$369['personId'] = undefined;
tmp$369['lat'] = undefined;
tmp$369['long'] = undefined;
//ugly solution but the problem otherwise would be that, since this are hygenic macro, the var lib outside would be renamed so I couldn't 
//acces to it, plus nodejs cache the require object so u just have a different pointer to the same thing
var lib$370 = require('./lib');
var isAtCoordinates$373 = lib$370.defineTemplate('isAtCoordinates', tmp$369);*/
var tmp$375 = {};
tmp$375['placeId'] = undefined;
tmp$375['latBL'] = undefined;
tmp$375['longBL'] = undefined;
tmp$375['latUR'] = undefined;
tmp$375['longUR'] = undefined;
//ugly solution but the problem otherwise would be that, since this are hygenic macro, the var lib outside would be renamed so I couldn't 
//acces to it, plus nodejs cache the require object so u just have a different pointer to the same thing
var lib$376 = require('./lib');
var hasCoordinates$379 = lib$376.defineTemplate('hasCoordinates', tmp$375);
var tmp$381 = {};
tmp$381['personId'] = undefined;
tmp$381['placeId'] = undefined;
//ugly solution but the problem otherwise would be that, since this are hygenic macro, the var lib outside would be renamed so I couldn't 
//acces to it, plus nodejs cache the require object so u just have a different pointer to the same thing
var lib$382 = require('./lib');
var isGoingTo$385 = lib$382.defineTemplate('isGoingTo', tmp$381);
var tmp$387 = {};
tmp$387['personId'] = undefined;
tmp$387['placeId'] = undefined;
//ugly solution but the problem otherwise would be that, since this are hygenic macro, the var lib outside would be renamed so I couldn't 
//acces to it, plus nodejs cache the require object so u just have a different pointer to the same thing
var lib$388 = require('./lib');
var shouldGoTo$391 = lib$388.defineTemplate('shouldGoTo', tmp$387);
var tmp$388 = {};
tmp$388['personId'] = undefined;
tmp$388['placeId'] = undefined;
//ugly solution but the problem otherwise would be that, since this are hygenic macro, the var lib outside would be renamed so I couldn't 
//acces to it, plus nodejs cache the require object so u just have a different pointer to the same thing
var lib$389 = require('./lib');
var shouldNotGoTo$392 = lib$389.defineTemplate('shouldNotGoTo', tmp$388);
var tmp$393 = {};
tmp$393['eventId'] = undefined;
tmp$393['name'] = undefined;
tmp$393['placeId'] = undefined;
tmp$393['startTime'] = undefined;
tmp$393['endTime'] = undefined;
//ugly solution but the problem otherwise would be that, since this are hygenic macro, the var lib outside would be renamed so I couldn't 
//acces to it, plus nodejs cache the require object so u just have a different pointer to the same thing
var lib$394 = require('./lib');
var isEvent$397 = lib$394.defineTemplate('isEvent', tmp$393);
var tmp$399 = {};
tmp$399['personId'] = undefined;
tmp$399['eventId'] = undefined;
//ugly solution but the problem otherwise would be that, since this are hygenic macro, the var lib outside would be renamed so I couldn't 
//acces to it, plus nodejs cache the require object so u just have a different pointer to the same thing
var lib$400 = require('./lib');
var isPartecipating$403 = lib$400.defineTemplate('isPartecipating', tmp$399);
var tmp$392 = {};
tmp$392['publicTransportation'] = undefined;
tmp$392['time'] = undefined;
tmp$392['direction'] = undefined;
tmp$392['lat'] = undefined;
tmp$392['long'] = undefined;
//ugly solution but the problem otherwise would be that, since this are hygenic macro, the var lib outside would be renamed so I couldn't 
//acces to it, plus nodejs cache the require object so u just have a different pointer to the same thing
var lib$395 = require('./lib');
var timeTable$397 = lib$395.defineTemplate('timeTable', tmp$392);
var tmp$405 = {};
tmp$405['personId'] = undefined;
tmp$405['publicTransportation'] = undefined;
tmp$405['direction'] = undefined;
//ugly solution but the problem otherwise would be that, since this are hygenic macro, the var lib outside would be renamed so I couldn't 
//acces to it, plus nodejs cache the require object so u just have a different pointer to the same thing
var lib$406 = require('./lib');
var goHomeBy$409 = lib$406.defineTemplate('goHomeBy', tmp$405);
var tmp$406 = {};
tmp$406['personIdNotified'] = undefined;
tmp$406['personIdNotification'] = undefined;
//ugly solution but the problem otherwise would be that, since this are hygenic macro, the var lib outside would be renamed so I couldn't 
//acces to it, plus nodejs cache the require object so u just have a different pointer to the same thing
var lib$407 = require('./lib');
var notifyCloseFriend$410 = lib$407.defineTemplate('notifyCloseFriend', tmp$406);
var tmp$407 = {};
tmp$407['personIdNotified'] = undefined;
tmp$407['publicTransportation'] = undefined;
tmp$407['direction'] = undefined;
tmp$407['time'] = undefined;
//ugly solution but the problem otherwise would be that, since this are hygenic macro, the var lib outside would be renamed so I couldn't 
//acces to it, plus nodejs cache the require object so u just have a different pointer to the same thing
var lib$408 = require('./lib');
var notifyPT$410 = lib$408.defineTemplate('notifyPT', tmp$407);
var tmp$408 = {};
tmp$408['eventId'] = undefined;
tmp$408['placeId'] = undefined;
tmp$408['startTime'] = undefined;
tmp$408['endTime'] = undefined;
//ugly solution but the problem otherwise would be that, since this are hygenic macro, the var lib outside would be renamed so I couldn't 
//acces to it, plus nodejs cache the require object so u just have a different pointer to the same thing
var lib$409 = require('./lib');
var notifyEvent$410 = lib$409.defineTemplate('notifyEvent', tmp$408);
var file$410 = './rule.nools';
lib$343.initNools(file$410);

