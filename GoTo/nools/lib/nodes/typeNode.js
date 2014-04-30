var AlphaNode = require("./alphaNode"),
    Context = require("../context");

AlphaNode.extend({
    instance: {

        constructor: function(constraint,type){
            this._super([constraint]);
            if((constraint.constraint.__type == undefined && type == undefined) || typeof type == "function")
                
            var typeVar;
            if(constraint.constraint.__type)
                typeVar = constraint.constraint.__type.toLowerCase();
            else
                typeVar = type.constructor.name.toLowerCase() //type.toLowerCase();
            this.type = typeVar;
        },
        //runTime means that we are asserting because a rule has been added at run time
        //ruleBetaNodes are the beta nodes used by the rule
        assert: function (fact,runTime,ruleBetaNodes) {
            if (this.constraintAssert(fact.object)) {
                this.__propagate("assert", fact,runTime,ruleBetaNodes);
            }
        },

        modify: function (fact) {
            if (this.constraintAssert(fact.object)) {
                this.__propagate("modify", fact);
            }
        },

        retract: function (fact) {
            if (this.constraintAssert(fact.object)) {
                this.__propagate("retract", fact);
            }
        },

        toString: function () {
            return "TypeNode" + this.__count;
        },

        dispose: function () {
            var es = this.__entrySet, i = es.length - 1;
            for (; i >= 0; i--) {
                var e = es[i], outNode = e.key, paths = e.value;
                outNode.dispose({paths: paths});
            }
        },

        __propagate: function (method, fact,runTime,ruleBetaNodes) {
            var es = this.__entrySet, i = -1, l = es.length;
            while (++i < l) {
                var e = es[i], outNode = e.key, paths = e.value;
                //if(outNode.new == undefined)
                    //debugger;
                /* typenode will always have an alphanode after him so also when I add a rule at run time I need to propagate
                if(runTime)
                    if(outNode.new)
                        outNode[method](new Context(fact, paths));*/                        
                //outNode.new = false;
                outNode[method](new Context(fact, paths),runTime,ruleBetaNodes);
                
            }
        }
    }
}).as(module);

