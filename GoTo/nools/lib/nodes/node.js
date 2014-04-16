var extd = require("../extended"),
    forEach = extd.forEach,
    indexOf = extd.indexOf,
    intersection = extd.intersection,
    declare = extd.declare,
    HashTable = extd.HashTable,
    Context = require("../context");

var count = 0;
declare({
    instance: {
        constructor: function () {
            this.nodes = new HashTable();
            this.rules = [];
            this.parentNodes = [];
            this.__count = count++;
            this.__entrySet = [];
            //this variable is used when you add a rule at run time, the nodes are marked as new so that 
            //we can update them. I can't use a boolean, because a betanode has 2 parents so the first time the 
            //adaptor node will set it new to false, but then the other adaptor node will have it as false, even
            //if the beta node is actually new  ==> use integer
            //this.new = true;
        },

        addRule: function (rule) {
            if (indexOf(this.rules, rule) === -1) {
                this.rules.push(rule);
            }
            return this;
        },

        merge: function (that) {
            that.nodes.forEach(function (entry) {
                var patterns = entry.value, node = entry.key;
                for (var i = 0, l = patterns.length; i < l; i++) {
                    this.addOutNode(node, patterns[i]);
                }
                that.nodes.remove(node);
            }, this);
            var thatParentNodes = that.parentNodes;
            for (var i = 0, l = that.parentNodes.l; i < l; i++) {
                var parentNode = thatParentNodes[i];
                this.addParentNode(parentNode);
                parentNode.nodes.remove(that);
            }
            return this;
        },

        resolve: function (mr1, mr2) {
            return mr1.hashCode === mr2.hashCode;
        },

        print: function (tab) {
            console.log(tab + this.toString());
            forEach(this.parentNodes, function (n) {
                n.print("    " + tab);
            });
        },

        addOutNode: function (outNode, pattern) {
            if (!this.nodes.contains(outNode)) {
                this.nodes.put(outNode, []);
            }
            this.nodes.get(outNode).push(pattern);
            this.__entrySet = this.nodes.entrySet();
        },

        addParentNode: function (n) {
            if (indexOf(this.parentNodes, n) === -1) {
                this.parentNodes.push(n);
            }
        },

        shareable: function () {
            return false;
        },

        __propagate: function (method, context,runTime,ruleBetaNodes) {
            var entrySet = this.__entrySet, i = entrySet.length, entry, outNode, paths, continuingPaths;
            while (--i > -1) {
                entry = entrySet[i];
                outNode = entry.key;
                /*if(outNode.new == undefined)
                    debugger;
                outNode.new  = false;*/
                paths = entry.value;

                if ((continuingPaths = intersection(paths, context.paths)).length) {
                    outNode[method](new Context(context.fact, continuingPaths, context.match),runTime,ruleBetaNodes);
                }

            }
        },

        dispose: function (assertable) {
            this.propagateDispose(assertable);
        },

        retract: function (assertable) {
            this.propagateRetract(assertable);
        },

        propagateDispose: function (assertable, outNodes) {
            outNodes = outNodes || this.nodes;
            var entrySet = this.__entrySet, i = entrySet.length - 1;
            for (; i >= 0; i--) {
                var entry = entrySet[i], outNode = entry.key;
                outNode.dispose(assertable);
            }
        },

        propagateAssert: function (assertable,runTime,ruleBetaNodes) {
            this.__propagate("assert", assertable,runTime,ruleBetaNodes);
        },

        propagateRetract: function (assertable) {
            this.__propagate("retract", assertable);
        },

        assert: function (assertable,runTime,ruleBetaNodes) {
            this.propagateAssert(assertable,runTime,ruleBetaNodes);
        },

        modify: function (assertable) {
            this.propagateModify(assertable);
        },

        propagateModify: function (assertable) {
            this.__propagate("modify", assertable);
        }
    }

}).as(module);
