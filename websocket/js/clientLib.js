function myWebSocket(address){
    ws = new WebSocket(address);
    ws.customListeners = [];
    ws.customCallBack = [];
   
    ws.addEventListener = function(event,cb){
        if(event in ws.customListeners){
            ws.customCallBack[ws.customListeners.indexOf(event)] = cb;
        }else{
            ws.customCallBack.push(cb);
            ws.customListeners.push(event);
        }
    }

    
    ws.onmessage = function(message){
        message = JSON.parse(message.data);
        /*if((index = indexofTemplate(message.__type)) < 0){
            throw "template not present in the list of template";
        }else{
            obj = new templates[index](message);
        }
        webSockets[obj.objectId] = ws;*/
        //todo: instantiate a new template, 
        //debugger;
        if(ws.customListeners.indexOf(message.__type) > -1)
            //delete message.__type; //?????
            ws.customCallBack[ws.customListeners.indexOf(message.__type)](message);
        else 
            console.log('no dedicated cb found');
    }

    return ws;
}

/*****util *******/
function indexofTemplate(type){
    for(i = 0; i < templates.length; i++)
        if(templates[i].prototype.__name.toLowerCase() === type.toLowerCase())
            return i;
    return -1;
}
