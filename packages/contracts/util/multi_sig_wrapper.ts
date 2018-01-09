import ABI = require('ethereumjs-abi');
import ethUtil = require('ethereumjs-util');
import * as _ from 'lodash';
import * as Web3 from 'web3';

import { ContractInstance, TransactionDataParams } from './types';

export class MultiSigWrapper {
    private _multiSig: ContractInstance;
    public static encodeFnArgs(name: string, abi: Web3.AbiDefinition[], args: any[]) {
        const abiEntity = _.find(abi, { name }) as Web3.MethodAbi;
        if (_.isUndefined(abiEntity)) {
            throw new Error(`Did not find abi entry for name: ${name}`);
        }
        const types = _.map(abiEntity.inputs, input => input.type);
        const funcSig = ethUtil.bufferToHex(ABI.methodID(name, types));
        const argsData = _.map(args, arg => {
            const target = _.isBoolean(arg) ? +arg : arg;
            const targetBuff = ethUtil.toBuffer(target);
            return ethUtil.setLengthLeft(targetBuff, 32).toString('hex');
        });
        return funcSig + argsData.join('');
    }
    constructor(multiSigContractInstance: ContractInstance) {
        this._multiSig = multiSigContractInstance;
    }
    public async submitTransactionAsync(
        destination: string,
        from: string,
        dataParams: TransactionDataParams,
        value: number = 0,
    ) {
        const { name, abi, args = [] } = dataParams;
        const encoded = MultiSigWrapper.encodeFnArgs(name, abi, args);
        return this._multiSig.submitTransaction(destination, value, encoded, {
            from,
        });
    }
}
