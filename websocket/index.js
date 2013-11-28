var server = require("./server");
var router = require("./route");
var requestHandlers = require("./requestHandler");

var handle = [];
handle["/"] = requestHandlers.start;
handle["/start"] = requestHandlers.start;
/*handle["/upload"] = requestHandlers.upload;
handle["/show"] = requestHandlers.show;*/


server.start(router.route, handle);