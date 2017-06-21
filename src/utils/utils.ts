import map = require('lodash/map');
import includes = require('lodash/includes');
import * as BN from 'bn.js';
import * as ethABI from 'ethereumjs-abi';
import * as ethUtil from 'ethereumjs-util';
import {Order, SignedOrder, SolidityTypes} from '../types';
import * as BigNumber from 'bignumber.js';

export const utils = {
    /**
     * Converts BigNumber instance to BN
     * The only reason we convert to BN is to remain compatible with `ethABI. soliditySHA3` that
     * expects values of Solidity type `uint` to be passed as type `BN`.
     * We do not use BN anywhere else in the codebase.
     */
    bigNumberToBN(value: BigNumber.BigNumber) {
        return new BN(value.toString(), 10);
    },
    consoleLog(message: string): void {
        // tslint:disable-next-line: no-console
        console.log(message);
    },
    isParityNode(nodeVersion: string): boolean {
        return includes(nodeVersion, 'Parity');
    },
    isValidOrderHash(orderHashHex: string): boolean {
        const isValid = /^0x[0-9A-F]{64}$/i.test(orderHashHex);
        return isValid;
    },
    spawnSwitchErr(name: string, value: any): Error {
        return new Error(`Unexpected switch value: ${value} encountered for ${name}`);
    },
    getOrderHashHex(order: Order|SignedOrder, exchangeContractAddr: string): string {
        const orderParts = [
            {value: exchangeContractAddr, type: SolidityTypes.address},
            {value: order.maker, type: SolidityTypes.address},
            {value: order.taker, type: SolidityTypes.address},
            {value: order.makerTokenAddress, type: SolidityTypes.address},
            {value: order.takerTokenAddress, type: SolidityTypes.address},
            {value: order.feeRecipient, type: SolidityTypes.address},
            {value: utils.bigNumberToBN(order.makerTokenAmount), type: SolidityTypes.uint256},
            {value: utils.bigNumberToBN(order.takerTokenAmount), type: SolidityTypes.uint256},
            {value: utils.bigNumberToBN(order.makerFee), type: SolidityTypes.uint256},
            {value: utils.bigNumberToBN(order.takerFee), type: SolidityTypes.uint256},
            {value: utils.bigNumberToBN(order.expirationUnixTimestampSec), type: SolidityTypes.uint256},
            {value: utils.bigNumberToBN(order.salt), type: SolidityTypes.uint256},
        ];
        const types = map(orderParts, o => o.type);
        const values = map(orderParts, o => o.value);
        const hashBuff = ethABI.soliditySHA3(types, values);
        const hashHex = ethUtil.bufferToHex(hashBuff);
        return hashHex;
    },
    getCurrentUnixTimestamp(): BigNumber.BigNumber {
        return new BigNumber(Date.now() / 1000);
    },
};
