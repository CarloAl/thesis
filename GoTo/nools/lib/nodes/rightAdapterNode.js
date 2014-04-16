var Node = require("./adapterNode");

Node.extend({
    instance: {

        retractResolve: function (match) {
            this.__propagate("retractResolve", match);
        },

        dispose: function (context) {
            this.propagateDispose(context);
        },

        propagateAssert: function (context,runTime,ruleBetaNodes) {
            this.__propagate("assertRight", context,runTime,ruleBetaNodes);
        },

        propagateRetract: function (context) {
            this.__propagate("retractRight", context);
        },

        propagateResolve: function (context) {
            this.__propagate("retractResolve", context);
        },

        propagateModify: function (context) {
            this.__propagate("modifyRight", context);
        },

        toString: function () {
            return "RightAdapterNode " + this.__count;
        }
    }
}).as(module);