import BN = require('bn.js');
import ABI = require('ethereumjs-abi');
import ethUtil = require('ethereumjs-util');
import * as _ from 'lodash';

export const crypto = {
    /*
   * We convert types from JS to Solidity as follows:
   * BigNumber -> uint256
   * number -> uint8
   * string -> string
   * boolean -> bool
   * valid Ethereum address -> address
   */
    solSHA3(args: any[]): Buffer {
        const argTypes: string[] = [];
        _.each(args, (arg, i) => {
            const isNumber = _.isFinite(arg);
            if (isNumber) {
                argTypes.push('uint8');
            } else if ((arg).isBigNumber) {
                argTypes.push('uint256');
                args[i] = new BN(arg.toString(10), 10);
            } else if (ethUtil.isValidAddress(arg)) {
                argTypes.push('address');
            } else if (_.isString(arg)) {
                argTypes.push('string');
            } else if  (_.isBoolean(arg)) {
                argTypes.push('bool');
            } else {
                throw new Error(`Unable to guess arg type: ${arg}`);
            }
        });
        const hash = ABI.soliditySHA3(argTypes, args);
        return hash;
    },
};
