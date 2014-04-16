var Node = require("./node"),
    intersection = require("../extended").intersection;

Node.extend({
    instance: {

        __propagatePaths: function (method, context,runTime,ruleBetaNodes) {
            var entrySet = this.__entrySet, i = entrySet.length, entry, outNode, paths, continuingPaths;
            while (--i > -1) {
                entry = entrySet[i];
                outNode = entry.key;
                if(outNode.new == undefined)
                    debugger;
                outNode.new++;
                paths = entry.value;
                if(runTime){
                    if(ruleBetaNodes.indexOf(outNode) > -1)
                        if(outNode.new <= 2) {
                            if ((continuingPaths = intersection(paths, context.paths)).length) {
                                outNode[method](context.clone(null, continuingPaths, null));
                            }
                        }else{
                            outNode.propagateAll();
                        }

                }else{
                    if ((continuingPaths = intersection(paths, context.paths)).length) {
                        outNode[method](context.clone(null, continuingPaths, null));
                    }    
                }
                
                
            }
        },

        __propagateNoPaths: function (method, context,runTime,ruleBetaNodes) {
            var entrySet = this.__entrySet, i = entrySet.length;
            while (--i > -1) {
                var outNode = entrySet[i].key;
                outNode.new++
                if(runTime){
                    if(ruleBetaNodes.indexOf(outNode) > -1)
                        if(outNode.new > 1) {
                            entrySet[i].key[method](context);
                        }else{
                            outNode.propagateAll();
                        }

                }else{
                    entrySet[i].key[method](context);    
                }
                
            }
        },

        __propagate: function (method, context,runTime,ruleBetaNodes) {
            if (context.paths) {
                this.__propagatePaths(method, context,runTime,ruleBetaNodes);
            } else {
                this.__propagateNoPaths(method, context,runTime,ruleBetaNodes);
            }
        }
    }
}).as(module);