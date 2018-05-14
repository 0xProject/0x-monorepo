import { AbiDefinition, MethodAbi } from '@0xproject/types';
import { BigNumber } from '@0xproject/utils';
import ABI = require('ethereumjs-abi');
import ethUtil = require('ethereumjs-util');
import * as _ from 'lodash';
import * as Web3 from 'web3';

import { MultiSigWalletContract } from '../src/contract_wrappers/generated/multi_sig_wallet';

import { TransactionDataParams } from './types';

export class MultiSigWrapper {
    private _multiSig: MultiSigWalletContract;
    public static encodeFnArgs(name: string, abi: AbiDefinition[], args: any[]): string {
        const abiEntity = _.find(abi, { name }) as MethodAbi;
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
    constructor(multiSigContract: MultiSigWalletContract) {
        this._multiSig = multiSigContract;
    }
    public async submitTransactionAsync(
        destination: string,
        from: string,
        dataParams: TransactionDataParams,
        value: BigNumber = new BigNumber(0),
    ): Promise<string> {
        const { name, abi, args = [] } = dataParams;
        const encoded = MultiSigWrapper.encodeFnArgs(name, abi, args);
        return this._multiSig.submitTransaction.sendTransactionAsync(destination, value, encoded, {
            from,
        });
    }
}
