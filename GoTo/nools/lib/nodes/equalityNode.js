var AlphaNode = require("./alphaNode");

AlphaNode.extend({
    instance: {

        constructor: function () {
            this.memory = {};
            this._super(arguments);
            this.constraintAssert = this.constraint.assert;
        },

        assert: function (context,runTime,ruleBetaNodes) {
            if ((this.memory[context.pathsHash] = this.constraintAssert(context.factHash))) {
                this.__propagate("assert", context,runTime,ruleBetaNodes);
            }
        },

        modify: function (context) {
            var memory = this.memory,
                hashCode = context.pathsHash,
                wasMatch = memory[hashCode];
            if ((memory[hashCode] = this.constraintAssert(context.factHash))) {
                this.__propagate(wasMatch ? "modify" : "assert", context);
            } else if (wasMatch) {
                this.__propagate("retract", context);
            }
        },

        retract: function (context) {
            var hashCode = context.pathsHash,
                memory = this.memory;
            if (memory[hashCode]) {
                this.__propagate("retract", context);
            }
            memory[hashCode] = null;
        },

        toString: function () {
            return "EqualityNode" + this.__count;
        }
    }
}).as(module);