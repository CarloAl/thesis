//var http = require("http");
//var url = require("url");

function route(handle,pathname,response,request){
   if ( typeof handle[pathname] == 'function' ){
      handle[pathname](response,request);
   }else{
      console.log("No request handler found for " + pathname);
      response.writeHead(404, {"Content-Type": "text/plain"});
      response.write('404 not found\n');
      response.end();
   }
}

exports.route = route;