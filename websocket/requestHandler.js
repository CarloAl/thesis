var exec = require("child_process").exec,
    querystring = require("querystring"),
    formidable = require ("formidable"),
    fs = require ("fs");


function start(response,request) {
   
   /*exec("ls -lah", function (error, stdout, stderr) {
      console.log("Request handler 'start' was called and continued.");
      response.writeHead(200, {"Content-Type": "text/plain"});
      response.write(stdout);
      response.end();
   });*/
  pathname = './html/start.html'


   response.writeHead(200, {"Content-Type": "text/html"});
   fs.readFile(pathname, function (err, data) {
        if (err) {
            console.log(err.message);
            response.writeHead(404, {'content-type': 'text/html'});
            response.write('File not found: ' + pathname);
            response.end();
        }
        else {
            response.writeHead(200, {"Content-Type": "text/html"});
            response.write(data);
            response.end();
        }
    });
   
   //response.write(body);

   

}
/*
function upload(response,request) {
   console.log("Request handler 'upload' was called.");
   
   var form = formidable.IncomingForm();
   console.log("About to parse");
   form.parse(request,function(error,fields,files){
      console.log("parsing done");
      /* Possible error on Windows systems:
      tried to rename to an already existing file */
      /*
      console.log(files.upload.path);
      fs.rename(files.upload.path, "./tmp/test.png",function(error){
         console.log(error);
         if(error){
            fs.unlink("./tmp/test.png");
            fs.rename(files.upload.path,"./tmp/test.png");
         }
       });
       response.writeHead(200, {"Content-Type": "text/html"});
       response.write("received image:<br/>");
       response.write("<img src='/show' />");
       response.end();
   });
}

function show(response,request){
   console.log("Request handler 'show' was called.");
   
   fs.readFile("./tmp/test.png", "binary", function(error, file) {
      if (error) {
         response.writeHead(500, {"Content-Type": "text/plain"});
         response.write(error + "\n");
         response.end();
      } else {
         response.writeHead(200, {"Content-Type": "image/png"});
         response.write(file, "binary");
         response.end();
      }
   });
   
}


exports.upload = upload;
exports.show = show;*/

exports.start = start;