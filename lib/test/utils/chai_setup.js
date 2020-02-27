"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var chai = require("chai");
var chaiAsPromised = require("chai-as-promised");
var ChaiBigNumber = require("chai-bignumber");
var dirtyChai = require("dirty-chai");
exports.chaiSetup = {
    configure: function () {
        chai.config.includeStack = true;
        chai.use(ChaiBigNumber());
        chai.use(dirtyChai);
        chai.use(chaiAsPromised);
    },
};
//# sourceMappingURL=chai_setup.js.map