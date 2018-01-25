import { BigNumber } from '@0xproject/utils';
import BN = require('bn.js');
import * as ethABI from 'ethereumjs-abi';
import * as ethUtil from 'ethereumjs-util';
import * as _ from 'lodash';

import { Order, SignedOrder, SolidityTypes } from '../types';

export const utils = {
    /**
     * Converts BigNumber instance to BN
     * The only reason we convert to BN is to remain compatible with `ethABI. soliditySHA3` that
     * expects values of Solidity type `uint` to be passed as type `BN`.
     * We do not use BN anywhere else in the codebase.
     */
    bigNumberToBN(value: BigNumber) {
        return new BN(value.toString(), 10);
    },
    consoleLog(message: string): void {
        // tslint:disable-next-line: no-console
        console.log(message);
    },
    isParityNode(nodeVersion: string): boolean {
        return _.includes(nodeVersion, 'Parity');
    },
    isTestRpc(nodeVersion: string): boolean {
        return _.includes(nodeVersion, 'TestRPC');
    },
    spawnSwitchErr(name: string, value: any): Error {
        return new Error(`Unexpected switch value: ${value} encountered for ${name}`);
    },
    getOrderHashHex(order: Order | SignedOrder): string {
        const orderParts = [
            { value: order.exchangeContractAddress, type: SolidityTypes.Address },
            { value: order.maker, type: SolidityTypes.Address },
            { value: order.taker, type: SolidityTypes.Address },
            { value: order.makerTokenAddress, type: SolidityTypes.Address },
            { value: order.takerTokenAddress, type: SolidityTypes.Address },
            { value: order.feeRecipient, type: SolidityTypes.Address },
            {
                value: utils.bigNumberToBN(order.makerTokenAmount),
                type: SolidityTypes.Uint256,
            },
            {
                value: utils.bigNumberToBN(order.takerTokenAmount),
                type: SolidityTypes.Uint256,
            },
            {
                value: utils.bigNumberToBN(order.makerFee),
                type: SolidityTypes.Uint256,
            },
            {
                value: utils.bigNumberToBN(order.takerFee),
                type: SolidityTypes.Uint256,
            },
            {
                value: utils.bigNumberToBN(order.expirationUnixTimestampSec),
                type: SolidityTypes.Uint256,
            },
            { value: utils.bigNumberToBN(order.salt), type: SolidityTypes.Uint256 },
        ];
        const types = _.map(orderParts, o => o.type);
        const values = _.map(orderParts, o => o.value);
        const hashBuff = ethABI.soliditySHA3(types, values);
        const hashHex = ethUtil.bufferToHex(hashBuff);
        return hashHex;
    },
    getCurrentUnixTimestampSec(): BigNumber {
        return new BigNumber(Date.now() / 1000).round();
    },
    getCurrentUnixTimestampMs(): BigNumber {
        return new BigNumber(Date.now());
    },
};
